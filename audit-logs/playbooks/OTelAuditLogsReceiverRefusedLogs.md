---
title: "Audit OTel receiver is refusing logs"
description: "Alert: OTelAuditLogsReceiverRefusedLogs"
weight: 90
---

**Alert:** `OTelAuditLogsReceiverRefusedLogs`

## Problem

An audit receiver other than filelog is rejecting records. The `receiver` label identifies which:
- `auditd` — kernel audit socket (requires `AUDIT_READ`, `AUDIT_WRITE`, `AUDIT_CONTROL` caps and host auditd stopped by init container).
- `auditpoller` — IAS audit event polling.
- `journald` — systemd journal (used by `selflogging`).
- `otlp` — pushed audit events from other collectors.

## Impact

Audit records from the affected receiver are **dropped at ingest**. **PCI-DSS: compliance gap**; investigate immediately.

## Diagnosis

1. Note `receiver` and `k8s_cluster_name` from alert.
1. Tail collector logs:
   ```sh
   kubectl logs ds/audit-logs-collector -n fortlogs-audit -c otc-container | grep -i <receiver>
   ```
1. For `auditd`: verify the init container successfully stopped host auditd. Check caps on any collector pod:
   ```sh
   kubectl get pods -n fortlogs-audit -l app.kubernetes.io/instance=fortlogs-audit.audit-logs \
     -o jsonpath='{.items[0].spec.containers[0].securityContext.capabilities}'
   ```
   Verify host auditd is not running: `kubectl debug node/<node> ... ps aux | grep auditd`.
1. For `auditpoller`: check audit-poller subchart pod state.
1. For `journald`: verify unit filter and priority config.

## Resolution Steps

1. Fix the sender if producing invalid payloads.
1. Adjust receiver config if sender is legitimate but mismatched.
1. For `auditd` cap issues: verify `_auditd-config.tpl` init container ran; if not, check hostPID and privilege settings.
1. Reconcile via Helm.
1. Confirm refusal rate drops to zero.
