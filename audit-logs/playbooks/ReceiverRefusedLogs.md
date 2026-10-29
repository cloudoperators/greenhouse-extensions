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

Check collector logs on the affected cluster: `kubectl logs ds/audit-logs-collector -n <ns> | grep -i refused`. Correlate the `receiver` label with recent config or source changes.

## Resolution Steps

Fix the receiver config or the upstream sender (format, rate, auth). Restart the collector if the issue is config-driven: `kubectl rollout restart ds/audit-logs-collector -n <ns>`.
