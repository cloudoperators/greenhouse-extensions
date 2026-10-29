---
title: OTelLogsExportFailureRatioHigh
weight: 20
---

# OTelLogsExportFailureRatioHigh

## Problem

More than 10% of log export attempts are failing for a specific exporter over the last 10 minutes. The `exporter` label in the alert identifies which failover leg is affected.

## Impact

Log records destined for the failing exporter are not being delivered. If both failover legs fail simultaneously, the queue will fill and the pipeline will stall.

## Diagnosis

1. Note the `exporter` label from the alert (e.g., `opensearch/primary`, `opensearch/failover`).
1. Inspect collector logs: `kubectl logs ds/logs-collector -n <ns> -c otc-container | grep -i "exporter.*error"`.
1. Look for: timeouts, 4xx/5xx HTTP responses, auth failures, TLS errors.
1. Check sink health (OpenSearch cluster status, Kafka broker list) and credentials in the mounted secret.

## Resolution Steps

1. Fix the sink (restart unhealthy nodes, clear disk pressure) or rotate credentials for the failing leg.
1. If one leg is down, verify failover is carrying traffic (check `otelcol_exporter_sent_log_records` for the healthy leg).
1. If credentials/config changed, restart: `kubectl rollout restart ds/logs-collector -n <ns>`.
1. Verify failure ratio drops below 10% within 5 minutes.
