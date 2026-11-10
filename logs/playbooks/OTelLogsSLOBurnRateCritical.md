---
title: OTelLogsSLOBurnRateCritical / OTelLogsSLOBurnRateWarning
weight: 20
---

# OTelLogsSLOBurnRate

## Problem

The export error budget is being consumed faster than the SLO allows (99.5% success rate over 28 days). `OTelLogsSLOBurnRateCritical` fires at 14x burn rate (budget exhausted in ~2 days). `OTelLogsSLOBurnRateWarning` fires at 6x burn rate (budget exhausted in ~4.5 days).

## Impact

Log records are being dropped and do not reach the sink (OpenSearch or Kafka). Failures are counted where records are finally dropped, so each failed record counts once. Sustained failures will exhaust the error budget and breach the SLO.

## Diagnosis

1. The `job` label says which collector: `<namespace>/opentelemetry-collector-logs` (node log agents) or `<namespace>/opentelemetry-collector-external` (syslog and HTTP receivers).
2. Find the failing component and the error type:

    ```promql
    sum by (exporter, error_type) (rate(otelcol_exporter_send_failed_log_records_total{job="<job>"}[10m]) and on (job, pod, exporter) otelcol_exporter_queue_capacity{job="<job>"})
    ```

    This lists the components whose failures are dropped records, as the alerts count them. A `failover/...` exporter is a failover connector: its failures are records none of its levels took, which happens when every level failed within the connector's `retry_interval`. Any other exporter here (Kafka, or an OpenSearch level with a sending queue) dropped the records after its queue and retries.
3. Check the destination (OpenSearch or Kafka) for errors, throttling or timeouts at the same time, and the collector log for `Exporting failed. Dropping data.`:

    ```bash
    kubectl logs -n <namespace> <pod> -c otc-container | grep -i "dropping data"
    ```

## Resolution Steps

1. Fix the destination or the connection to it. Once failures stop, the critical burn-rate and ratio alerts clear within minutes, the warning burn-rate alert within about 30 minutes.
2. If a failover connector fails while the destination recovers quickly, its levels were both marked unhealthy and skipped for the whole `retry_interval`; a shorter interval reduces the loss per incident.
