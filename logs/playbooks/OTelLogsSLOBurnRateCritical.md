---
title: "Export SLO burn rate is critical"
description: "Alert: OTelLogsSLOBurnRateCritical"
weight: 10
---

**Alert:** `OTelLogsSLOBurnRateCritical`

## Problem

The export error budget (99.5% success over 28 days) is being consumed at 14x the sustainable rate. At this pace, the full budget is gone in ~2 days. Both the 1h and 5m windows must breach simultaneously (fast-burn detection).

This is a **budget alert**, not a root-cause alert. The actual failure is reported by [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}).

## Impact

If sustained, the SLO is formally breached in ~2 days. Compliance and customer commitments at risk.

## Diagnosis

1. Note the `k8s_cluster_name`.
1. Check which exporter is driving the failures:
   ```promql
   topk(5, sum by (exporter) (rate(otelcol_exporter_send_failed_log_records{k8s_cluster_name="<cluster>"}[1h])))
   ```
1. Check if [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) is firing for the same cluster — it should be; use its playbook for root cause.
1. Review collector logs for the dominant error class.

## Resolution Steps

1. Treat the underlying [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) as the root cause and follow its playbook.
1. Critical burn rate means **page the sink owner immediately** — do not wait for business hours.
1. Once the underlying failure clears, the burn rate decays naturally. Verify both the 1h and 5m error rates fall below the SLO threshold.
