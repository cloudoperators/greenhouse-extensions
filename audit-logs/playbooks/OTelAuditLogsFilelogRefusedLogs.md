---
title: "Audit filelog receiver is refusing logs"
description: "Alert: OTelAuditLogsFilelogRefusedLogs"
weight: 40
---

**Alert:** `OTelAuditLogsFilelogRefusedLogs`

## Problem

The `filelog` receiver on the `audit-logs` DaemonSet is rejecting records. This typically applies to:
- `kubeApiAudit` source — kube-apiserver audit webhook log file.
- `containerd` source — container stdout/stderr if enabled.
- `selflogging` — the collector's own filelog output.

Common causes:
- Malformed audit event (unexpected JSON schema).
- Multiline recombine mismatch.
- Operator parser timeouts on large audit payloads (bodies up to several MB).

## Impact

Audit records from the affected source on that node are **dropped at the receiver**. **PCI-DSS: this is a compliance gap** that must be investigated promptly.

## Diagnosis

1. Note the affected node from alert labels.
1. Tail audit-logs-collector logs across the DaemonSet, filtered to the affected node, or target the pod directly:
   ```sh
   POD=$(kubectl get pods -n fortlogs-audit -l app.kubernetes.io/instance=fortlogs-audit.audit-logs -o jsonpath='{.items[0].metadata.name}')
   kubectl logs "$POD" -n fortlogs-audit -c otc-container | grep -iE "filelog|operator|parse"
   ```
1. Inspect raw audit file on node:
   ```sh
   kubectl debug node/<node> -it --image=busybox -- chroot /host tail /var/log/kube-apiserver-audit.log
   ```
1. For kube-apiserver audit: check if the audit policy was changed to emit a new resource/verb pattern.

## Resolution Steps

1. If a parser is misconfigured, fix the operator stanza (regex, multiline, timestamp) in the `auditLogs.logsCollector` filelog config.
1. If malformed events come from kube-apiserver, confirm the audit policy change is intentional. Do NOT silently drop audit records — tune the parser instead.
1. Reconcile via Helm; operator restarts the DaemonSet.
1. Verify refusal rate returns to zero: `rate(otelcol_receiver_refused_log_records{job=~".*/audit-collector-logs", receiver="filelog"}[5m])`.
