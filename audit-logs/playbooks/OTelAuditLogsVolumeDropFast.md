---
title: "Audit log volume dropped sharply"
description: "Alert: OTelAuditLogsVolumeDropFast"
weight: 60
---

**Alert:** `OTelAuditLogsVolumeDropFast`

## Problem

An audit cluster is exporting less than 20% of its 1-hour baseline. Measured on `otelcol_exporter_sent_log_records` — the drop is after processing.

**Treat as a potential compliance incident.** A sudden drop in audit volume could be:
- Silent collector failure.
- Audit policy was narrowed (less logged).
- auditd rule was accidentally removed.
- kube-apiserver audit webhook disabled.
- **Deliberate suppression (worst case).**

## Impact

**PCI-DSS: compliance gap.** Audit coverage is reduced on affected nodes. If deliberate suppression is involved, this is a security incident.

## Diagnosis

1. Check if drop is per-node or cluster-wide:
   ```promql
   sum by (k8s_node_name) (rate(otelcol_exporter_sent_log_records{job=~".*/audit-collector-logs"}[5m]))
   ```
1. If per-node: follow [`OTelAuditLogsMissing`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsmissing.md" >}}).
1. If cluster-wide:
   - Check for correlated [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}).
   - Check `audit-logs-collector` DaemonSet config history: `kubectl rollout history ds/audit-logs-collector -n fortlogs-audit`.
   - Verify kube-apiserver audit policy was not recently changed (control plane config).
   - Check `otelcol_processor_dropped_log_records` for a processor silently filtering.
1. **Review recent cluster admin actions in the audit trail itself** for policy changes.

## Resolution Steps

1. If pod-level failure: restart affected pods.
1. If config regression: roll back the Helm release.
1. If kube-apiserver audit policy narrowed inappropriately: restore the policy and roll the control plane.
1. If auditd rule was removed: restore `_auditd-config.tpl` rules.
1. If sink-side: follow `OTelAuditLogsExportingFailed`.
1. **Report the gap window and root cause to the compliance/security team.**
