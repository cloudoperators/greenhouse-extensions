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

Check collector logs on the affected cluster: `kubectl logs ds/logs-collector -n <ns> | grep -i refused`. Correlate the `receiver` label with recent config or source changes.

## Resolution Steps

Fix the receiver config or the upstream sender (format, rate, auth). Restart the collector if the issue is config-driven: `kubectl rollout restart ds/logs-collector -n <ns>`.
