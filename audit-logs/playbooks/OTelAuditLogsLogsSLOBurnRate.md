---
title: OTelLogsSLOBurnRateCritical / OTelLogsSLOBurnRateWarning
weight: 20
---

# OTelLogsSLOBurnRate

## Problem

The audit export error budget is being consumed faster than SLO allows (99.5% over 28 days). Critical at 14x (budget exhausted ~2 days); warning at 6x (~4.5 days).

## Impact

Audit records being dropped or failing to reach the sink. Sustained failures breach SLO and PCI-DSS compliance.

## Diagnosis

1. Find failing exporter: check `OTelLogsExportFailureRatioHigh` for same cluster.
1. Check sink availability, auth, config/credential changes.
1. Review collector logs: `kubectl logs ds/audit-logs-collector -n <ns> -c otc-container | grep -i error`.

## Resolution Steps

1. Treat underlying export failure as root cause; follow `OTelLogsExportFailureRatioHigh`.
1. Critical: page sink owner immediately.
2. Warning: can wait for business hours unless it escalates.
