---
title: OTelLogsVolumeSpike / OTelLogsVolumeDropFast / Increasing / Decreasing
weight: 20
---

# OTelLogsVolumeAnomaly

## Problem

`VolumeSpike` / `Increasing`: audit log volume is well above the baseline, suggesting misconfiguration, a noisy source, or an injection attempt.

`VolumeDropFast` / `Decreasing`: audit log volume is well below the baseline, suggesting a silent crash, pipeline stall, or sink outage.

## Impact

Spikes cause queue saturation and increased cost. Drops mean audit data is being lost on affected nodes — a PCI-DSS compliance concern.

## Diagnosis

1. Identify top sources by namespace/pod via OpenSearch, or
1. `otelcol_receiver_accepted_log_records` by receiver.
1. For drops, check daemonset pod health, recent deploys, and sink availability.

## Resolution Steps

1. For spikes: silence the noisy source (log level, filter in collector) and notify the owner.
1. For drops: restart affected collector pods, verify sink, and follow `OTelLogsMissing` if nodes are silent.
