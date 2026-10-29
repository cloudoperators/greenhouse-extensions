---
title: "Audit OTel receiver is refusing metrics"
description: "Alert: OTelAuditLogsReceiverRefusedMetric"
weight: 100
---

**Alert:** `OTelAuditLogsReceiverRefusedMetric`

## Problem

An OTel receiver on the audit-logs collector is rejecting metric points. Typically the `prometheus` receiver scraping self-telemetry and audit-poller metrics.

Common causes: unsupported metric type, label cardinality, malformed exposition.

## Impact

Audit metrics are missing. Audit log flow is **unaffected**. PCI-DSS compliance for audit records is not immediately impacted, but observability of the audit pipeline is reduced.

## Diagnosis

1. Tail audit-logs-collector logs:
   ```sh
   kubectl logs ds/audit-logs-collector -n fortlogs-audit -c otc-container | grep -iE "refused|invalid|metric"
   ```
1. Identify scrape target or sender from the error context.

## Resolution Steps

1. Fix the sender/target exposition.
1. Adjust receiver config in `auditLogs.logsCollector` values if too strict.
1. Reconcile via Helm.
1. Verify: `rate(otelcol_receiver_refused_metric_points{job=~".*/audit-collector-logs"}[5m])` returns to zero.
