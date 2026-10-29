---
title: "Logs are failing to export"
description: "Alert: OTelLogsExportingFailed"
weight: 100
---

**Alert:** `OTelLogsExportingFailed`

## Problem

Fewer than 90% of attempted log exports succeeded over the last 1 hour (cluster-wide). Scope is the exporter — the receiver side is working.

Common causes:
- Sink (OpenSearch or Kafka) is unhealthy, slow, or returning errors.
- Credentials expired or wrong (401/403 from sink).
- Both failover legs degraded simultaneously.
- Network path to sink broken (DNS, SG, mTLS).

## Impact

Rejected records go to the retry queue. If the queue fills, [`OTelLogsExporterQueueFull`]({{< relref "/docs/operations/playbooks/logs/otellogsexporterqueuefilling.md" >}}) will fire and new records are blocked at the receiver.

## Diagnosis

1. Identify which exporter(s) are failing:
   ```promql
   sum by (exporter) (rate(otelcol_exporter_send_failed_log_records{job=~".*/opentelemetry-collector-logs"}[10m]))
   ```
1. Tail collector logs for the exporter name:
   ```sh
   kubectl logs ds/logs-collector -n fortlogs-logs -c otc-container | grep -iE "exporter|failed|export"
   ```
1. Classify the error:
   - 4xx (401/403): credential issue.
   - 429: rate limit from sink.
   - 5xx or timeout: sink-side health or network.
   - TLS: cert validity/CA chain.
1. Check sink pod state (OpenSearch) or broker list (Kafka).

## Resolution Steps

1. If credentials: verify the `otel-basic-auth` secret has valid `username_a/password_a` and `username_b/password_b` pairs. Rotate if expired, then let the stakater reloader restart the collectors (or restart manually).
1. If sink is unhealthy, escalate to the OpenSearch/Kafka owner. The collector will retry automatically once sink recovers.
1. If one failover leg is down, verify traffic is flowing on the other leg (`sum by (exporter) (rate(otelcol_exporter_sent_log_records[5m]))`). No collector action needed.
1. If network: check NetworkPolicy, DNS resolution from the collector pod, and TLS CA bundle.
1. After sink recovery, verify success ratio climbs back above 90%.
