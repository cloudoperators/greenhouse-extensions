---
title: OTelLogsExportFailureRatioHigh
weight: 20
---

# OTelLogsExportFailureRatioHigh

## Problem

More than 10% of audit log export attempts are failing for a specific exporter over 10 minutes. The `exporter` label identifies which failover leg is affected.

## Impact

Audit records destined for the failing exporter are not delivered. If both failover legs fail, the queue fills and the pipeline stalls. Audit coverage is lost.

## Diagnosis

1. Note `exporter` label (e.g., `opensearch/primary`).
1. Inspect logs: `kubectl logs ds/audit-logs-collector -n <ns> -c otc-container | grep -i "exporter.*error"`.
1. Look for: timeouts, 4xx/5xx, auth failures, TLS errors.
1. Check sink health and credentials.

## Resolution Steps

1. Fix the sink or rotate credentials for the failing leg.
1. If one leg down, verify failover carries traffic (check `otelcol_exporter_sent_log_records`).
1. If credentials/config changed, restart: `kubectl rollout restart ds/audit-logs-collector -n <ns>`.
1. Verify failure ratio drops below 10% within 5 minutes.
