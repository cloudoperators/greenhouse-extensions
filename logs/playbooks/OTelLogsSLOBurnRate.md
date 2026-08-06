---
title: OTelLogsSLOBurnRateCritical / OTelLogsSLOBurnRateWarning
weight: 20
---

# OTelLogsSLOBurnRate

## Problem

The export error budget is being consumed faster than the SLO allows (99.5% success rate over 28 days). `OTelLogsSLOBurnRateCritical` fires at 14x burn rate (budget exhausted in ~2 days). `OTelLogsSLOBurnRateWarning` fires at 6x burn rate (budget exhausted in ~4.5 days).

## Impact

Log records are being dropped or failing to reach the sink (OpenSearch or Kafka). Sustained failures will exhaust the error budget and breach the SLO.

## Diagnosis

## Resolution Steps
