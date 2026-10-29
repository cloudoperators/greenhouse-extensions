---
title: "Log export failure ratio is high"
description: "Alert: OTelLogsExportFailureRatioHigh"
weight: 50
---

**Alert:** `OTelLogsExportFailureRatioHigh`

## Problem

More than 10% of export attempts on a specific exporter are failing (10 min window). The `exporter` label identifies the failing leg (e.g., `opensearch/primary`, `opensearch/failover`, `kafka/primary`).

This is finer-grained than [`OTelLogsExportingFailed`]({{< relref "/docs/operations/playbooks/logs/otellogsexportingfailed.md" >}}) — fires per exporter, not per cluster.

## Impact

Records going through the failing exporter are being retried. If the failover leg is healthy, traffic shifts automatically. If both legs are degraded, queue pressure builds (see [`OTelLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/logs/otellogsexporterqueuefilling.md" >}})).

## Diagnosis

1. Note the `exporter` and `k8s_cluster_name` labels.
1. Check the sibling failover leg:
   ```promql
   sum by (exporter) (rate(otelcol_exporter_sent_log_records{k8s_cluster_name="<cluster>"}[5m]))
   ```
   If one leg is zero or very low, failover is doing its job.
1. Tail collector logs filtering by exporter name:
   ```sh
   kubectl logs ds/logs-collector -n fortlogs-logs -c otc-container | grep "<exporter-name>"
   ```
1. Classify by error code (401/403/429/5xx/timeout/TLS).

## Resolution Steps

1. If auth error (4xx): rotate the credentials in the `otel-basic-auth` secret (`username_a/password_a` for primary, `_b` for failover) and let secret-reloader restart pods.
1. If 429: raise retry backoff or temporarily reduce queue consumer count. Escalate rate limit discussion with sink owner.
1. If 5xx/timeout: sink-side issue — escalate to sink owner. Collector will retry automatically.
1. If TLS: verify CA bundle in the collector pod matches the sink certificate chain.
1. After fix, confirm the per-exporter failure ratio drops below 10%.
