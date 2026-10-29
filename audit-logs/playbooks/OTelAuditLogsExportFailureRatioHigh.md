---
title: "Audit log export failure ratio is high"
description: "Alert: OTelAuditLogsExportFailureRatioHigh"
weight: 50
---

**Alert:** `OTelAuditLogsExportFailureRatioHigh`

## Problem

More than 10% of audit export attempts on a specific exporter are failing (10 min window). Fires per exporter leg (`opensearch/primary`, `opensearch/failover`, `kafka/primary`).

## Impact

Audit records to the failing leg are retried. If failover leg healthy, traffic shifts transparently. If both fail, queue builds and [`OTelAuditLogsMissing`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsmissing.md" >}}) risks firing. **PCI-DSS: active compliance risk.**

## Diagnosis

1. Note `exporter` and `k8s_cluster_name`.
1. Check failover leg status:
   ```promql
   sum by (exporter) (rate(otelcol_exporter_sent_log_records{job=~".*/audit-collector-logs", k8s_cluster_name="<cluster>"}[5m]))
   ```
1. Tail collector logs:
   ```sh
   kubectl logs ds/audit-logs-collector -n fortlogs-audit -c otc-container | grep "<exporter>"
   ```
1. Classify error (401/403/429/5xx/timeout/TLS).

## Resolution Steps

1. If auth error: rotate `audit-logs-basic-auth` secret (primary `_a` or failover `_b` credentials). secret-reloader restarts pods.
1. If 429: raise retry backoff; escalate to sink owner.
1. If 5xx/timeout: escalate sink issue; collector retries automatically.
1. If TLS: verify CA bundle matches sink chain.
1. Verify failure ratio drops below 10%. **Report gap to compliance if sustained.**
