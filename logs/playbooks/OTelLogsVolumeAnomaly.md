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

## Resolution Steps
