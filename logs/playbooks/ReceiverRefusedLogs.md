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

## Resolution Steps
