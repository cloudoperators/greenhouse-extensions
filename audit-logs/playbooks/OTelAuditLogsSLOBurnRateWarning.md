---
title: "Audit export SLO burn rate is elevated"
description: "Alert: OTelAuditLogsSLOBurnRateWarning"
weight: 20
---

**Alert:** `OTelAuditLogsSLOBurnRateWarning`

## Problem

The audit export error budget is burning at 6x. Budget consumed in ~4.5 days. Slow-burn detection (both 6h and 30m windows).

Budget alert; root cause reported by [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}).

## Impact

PCI-DSS SLO breach in ~4.5 days if sustained. Less urgent than critical, but requires business-day attention.

## Diagnosis

1. Note `k8s_cluster_name`.
1. Identify failing exporter:
   ```promql
   topk(5, sum by (exporter) (rate(otelcol_exporter_send_failed_log_records{job=~".*/audit-collector-logs", k8s_cluster_name="<cluster>"}[6h])))
   ```
1. Check for [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}).
1. If no acute spike, review last 24-48h for sink availability and credential rotations.

## Resolution Steps

1. Follow [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}) for root cause.
1. Business-hours response unless escalates to critical.
1. Verify burn rate drops below 6x once underlying failures clear.
