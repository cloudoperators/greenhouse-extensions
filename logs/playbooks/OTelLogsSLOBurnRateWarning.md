---
title: "Export SLO burn rate is elevated"
description: "Alert: OTelLogsSLOBurnRateWarning"
weight: 20
---

**Alert:** `OTelLogsSLOBurnRateWarning`

## Problem

The export error budget is being consumed at 6x the sustainable rate. At this pace, the budget runs out in ~4.5 days. Both the 6h and 30m windows must breach (slow-burn detection).

This is a **budget alert**, not a root-cause alert. The actual failure is reported by [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}).

## Impact

If sustained, SLO breach in ~4.5 days. Less urgent than critical burn, but requires attention within the business day.

## Diagnosis

1. Note the `k8s_cluster_name`.
1. Identify the failing exporter:
   ```promql
   topk(5, sum by (exporter) (rate(otelcol_exporter_send_failed_log_records{k8s_cluster_name="<cluster>"}[6h])))
   ```
1. Check for a corresponding [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) alert — follow its playbook for root cause.
1. If no high-ratio alert, the failures may be spread across time (consistent ~5-8% failure rate) rather than spiking.

## Resolution Steps

1. Follow [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) for root cause.
1. If no acute spike, review recent sink availability and credential rotation history for the past 24-48h.
1. Can usually wait for business hours unless burn rate escalates to critical.
1. Verify burn rate drops below 6x once underlying failures clear.
