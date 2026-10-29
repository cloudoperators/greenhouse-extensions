---
title: ReceiverRefusedLogs
weight: 20
---

# ReceiverRefusedLogs

## Problem

An audit OTel receiver is rejecting log records. The `{{ $labels.receiver }}` label identifies which receiver is affected (e.g. `auditd`, `journald`, `kube_api_audit`).

## Impact

Audit records from the affected receiver are not collected and shipped. Depending on the receiver, this may mean missing auditd events, kube-apiserver audit, or systemd journal entries.

## Diagnosis

1. Check collector logs: `kubectl logs ds/audit-logs-collector -n <ns> -c otc-container | grep -i refused`.
1. Note the `receiver` label from the alert.
1. Correlate with recent config changes or upstream audit source changes.

## Resolution Steps

1. Fix the receiver config or adjust the upstream sender (format, rate, auth).
1. Apply: `kubectl rollout restart ds/audit-logs-collector -n <ns>`.
1. Verify refusal rate drops within 5 minutes.
