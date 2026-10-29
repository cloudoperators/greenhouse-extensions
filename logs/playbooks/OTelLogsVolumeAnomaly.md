---
title: OTelLogsVolumeSpike / OTelLogsVolumeDropFast
weight: 20
---

# OTelLogsVolumeAnomaly

## Problem

`OTelLogsVolumeSpike`: The cluster is receiving logs at 5x the 1-hour baseline rate. This may indicate a logging misconfiguration, a log storm, or a log injection attempt.

`OTelLogsVolumeDropFast`: The cluster is exporting less than 20% of the 1-hour baseline volume. This may indicate a silent daemonset crash, a pipeline stall, or a backend outage.

## Impact

Volume spikes may cause queue saturation and increased cost. Volume drops mean log data is being lost or not collected on affected nodes.

## Diagnosis

1. Identify top sources:
   - Query OpenSearch for top namespaces/pods by log volume in the last hour, OR
   - Use Prometheus: `topk(10, sum by (namespace, pod) (rate(otelcol_receiver_accepted_log_records[10m])))`.
1. For spikes: correlate with recent deploys or config rollouts.
1. For drops: check DaemonSet pod health (`kubectl get pods -n <ns> -l app.kubernetes.io/name=opentelemetry-collector`), recent rollouts, and sink availability.

## Resolution Steps

1. For spikes:
   1. Silence the noisy source (lower log level in app, add filter processor in collector).
   1. Notify the source owner.
   1. If volume remains high, raise queue size or add filtering rules.
1. For drops:
   1. Restart affected collector pods: `kubectl delete pod <pod> -n <ns>`.
   1. Verify sink is accepting traffic (check backend health).
   1. If nodes remain silent, follow `OTelLogsMissing`.
