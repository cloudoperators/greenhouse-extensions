---
title: "Log volume spike detected"
description: "Alert: OTelLogsVolumeSpike"
weight: 90
---

**Alert:** `OTelLogsVolumeSpike`

## Problem

A cluster is receiving logs at 5x the 1-hour baseline (measured from 1h ago, sustained 5min). This is a **receiver-side** metric, so it captures all ingested logs before any filtering or export.

Common causes:
- Application rolled out with higher verbosity or a logging regression.
- Log storm from an application error loop.
- Log injection or scraper misconfigured to ingest something new.
- Legitimate traffic growth.

## Impact

Receiver load increases; queue pressure may follow. Downstream cost rises if the spike persists.

## Diagnosis

1. Identify the affected cluster.
1. Query top producers at the receiver:
   ```promql
   topk(10, sum by (k8s_namespace_name, k8s_pod_name) (
     rate(otelcol_receiver_accepted_log_records{job=~".*/opentelemetry-collector-logs"}[5m])
   ))
   ```
1. Correlate the top namespaces with recent deployments (`kubectl rollout history` or GitOps commit log).
1. Check [`OTelLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/logs/otellogsexporterqueuefilling.md" >}}) — if also firing, the pipeline is under strain.

## Resolution Steps

1. Contact the owner of the noisiest source and lower verbosity or fix the error loop.
1. For immediate mitigation, add a `filter` or `transform` processor to drop/sample the noisy source.
1. If the spike is legitimate (release, incident), raise `sending_queue.queue_size` temporarily and notify the sink owner.
1. Verify receiver rate returns within 5x of baseline.
