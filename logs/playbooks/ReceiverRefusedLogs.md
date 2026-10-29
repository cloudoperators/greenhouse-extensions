---
title: ReceiverRefusedLogs
weight: 20
---

# ReceiverRefusedLogs

## Problem

An OTel receiver is rejecting log records. The `{{ $labels.receiver }}` label identifies which receiver is affected (e.g. `filelog`, `journald`, `k8s_events`).

## Impact

Log records from the affected receiver are not being collected and shipped to the sink. Depending on the receiver, this may mean missing node-level logs, Kubernetes events, or systemd unit output.

## Diagnosis

1. Check collector logs on the affected cluster: `kubectl logs ds/logs-collector -n <ns> -c otc-container | grep -i refused`.
1. Note the `receiver` label from the alert.
1. Correlate with recent config changes or upstream source changes.

## Resolution Steps

1. Fix the receiver config (operator syntax, multiline rules, rate limits) or adjust the upstream sender (format, rate, auth).
1. Apply config: `kubectl rollout restart ds/logs-collector -n <ns>`.
1. Verify refusal rate drops: check alert clears within 5 minutes.
