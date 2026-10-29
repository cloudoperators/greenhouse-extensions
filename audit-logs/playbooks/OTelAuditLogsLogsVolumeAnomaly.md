---
title: OTelLogsVolumeSpike / OTelLogsVolumeDropFast / Increasing / Decreasing
weight: 20
---

# OTelLogsVolumeAnomaly

## Problem

`VolumeSpike` / `Increasing`: audit log volume well above baseline, suggesting misconfiguration, noisy source, or injection attempt.

`VolumeDropFast` / `Decreasing`: audit log volume well below baseline, suggesting crash, pipeline stall, or sink outage.

## Impact

Spikes cause queue saturation and cost increase. Drops mean audit data lost on affected nodes — PCI-DSS compliance concern.

## Diagnosis

1. Identify top sources:
   - Query OpenSearch for top namespaces/pods by audit volume, OR
   - Use Prometheus: `topk(10, sum by (namespace, pod) (rate(otelcol_receiver_accepted_log_records[10m])))`.
1. For spikes: correlate with recent deploys or config rollouts.
1. For drops: check DaemonSet pod health, recent rollouts, sink availability.

## Resolution Steps

1. For spikes:
   1. Lower log level at the source or add collector filter.
   1. Notify source owner.
   1. If volume high, raise queue size or add filtering.
1. For drops:
   1. Restart affected pods: `kubectl delete pod <pod> -n <ns>`.
   1. Verify sink accepting traffic.
   1. If nodes remain silent, follow `OTelLogsMissing`.
