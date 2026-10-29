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

1. Identify top sources by namespace/pod via OpenSearch, or
1. `otelcol_receiver_accepted_log_records` by receiver.
1. For drops, check Daemonset pod health, recent deploys, and sink availability.

## Resolution Steps

1. For spikes: silence the noisy source (log level, filter in collector) and notify the owner.
1. For drops: restart affected collector pods, verify sink, and follow `OTelLogsMissing` if nodes are silent.
