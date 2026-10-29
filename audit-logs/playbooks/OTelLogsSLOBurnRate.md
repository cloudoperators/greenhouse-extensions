---
title: OTelLogsSLOBurnRateCritical / OTelLogsSLOBurnRateWarning
weight: 20
---

# OTelLogsSLOBurnRate

## Problem

The audit export error budget is being consumed faster than the SLO allows (99.5% success rate over 28 days). Critical fires at 14x burn (budget exhausted in ~2 days); warning at 6x burn (~4.5 days).

## Impact

Audit records are being dropped or failing to reach the sink. Sustained failures will exhaust the error budget and breach the SLO, with PCI-DSS compliance implications.

## Diagnosis

1. Find which exporter is failing via `OTelLogsExportFailureRatioHigh`.
1. Check sink availability, auth, and recent config/credential changes.
1. Review collector logs for the dominant error class.

## Resolution Steps

1. Treat the underlying export failure as the root cause and follow `OTelLogsExportFailureRatioHigh`.
1. Critical burn rate warrants paging the sink owner; warning can wait for business hours unless it escalates.
