---
title: "Log volume is increasing"
description: "Alert: OTelLogsIncreasing"
weight: 80
---

**Alert:** `OTelLogsIncreasing`

## Problem

Export volume on a cluster is 4x higher than the baseline from 2 hours ago (sustained for 6h). The alert measures `otelcol_exporter_sent_log_records` increase — if it fires, the volume is already leaving the pipeline.

Common causes:
- A noisy workload was deployed or had its log level changed (DEBUG, verbose JSON).
- Log injection or infinite error loop in an application.
- Legitimate traffic increase following a release or incident.

## Impact

Downstream storage cost rises. Index growth may push OpenSearch toward disk pressure. The collector pipeline itself is coping (otherwise [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) would fire).

## Diagnosis

1. Find the top-growing sources via OpenSearch (sort by document count, group by `kubernetes.namespace_name` and `kubernetes.pod_name` for the last 6h vs. prior 6h).
1. Or query receiver metrics:
   ```promql
   topk(10, sum by (k8s_namespace_name, k8s_pod_name) (
     rate(otelcol_receiver_accepted_log_records{job=~".*/opentelemetry-collector-logs"}[1h])
   ))
   ```
1. Correlate with recent `Deployment`, `StatefulSet`, or `ConfigMap` changes in those namespaces.

## Resolution Steps

1. Contact the owner of the noisy workload and have them lower verbosity.
1. If immediate mitigation is needed, add a `filter` or `transform` processor in the `openTelemetry.logsCollector` config to drop or sample the loudest source.
1. If the spike is legitimate, raise `sending_queue.queue_size` and notify the OpenSearch backend owner so capacity is planned.
1. Verify volume returns to baseline over the next 2-6h.
