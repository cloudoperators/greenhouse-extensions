---
title: "Audit export SLO burn rate is critical"
description: "Alert: OTelAuditLogsSLOBurnRateCritical"
weight: 10
---

**Alert:** `OTelAuditLogsSLOBurnRateCritical`

## Problem

The audit export error budget (99.5% success over 28 days) is burning at 14x. Full budget consumed in ~2 days. Fast-burn detection (both 1h and 5m windows breach).

Budget alert; the actual failure is [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}).

## Impact

**PCI-DSS: SLO breach imminent.** If sustained, formal compliance breach within 2 days.

## Diagnosis

1. Note `k8s_cluster_name`.
1. Identify failing exporter:
   ```promql
   topk(5, sum by (exporter) (rate(otelcol_exporter_send_failed_log_records{job=~".*/audit-collector-logs", k8s_cluster_name="<cluster>"}[1h])))
   ```
1. Verify [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}) is firing — follow its playbook for root cause.
1. Review logs for dominant error class.

## Resolution Steps

1. Treat [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}) as root cause.
1. **Page sink owner immediately** — audit SLO breach is a compliance event.
1. Once resolved, burn rate decays. Verify both 1h and 5m error rates fall below SLO threshold.
1. **Document the incident for the compliance team.**
