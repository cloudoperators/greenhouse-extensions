---
title: FilelogRefusedLogs
weight: 20
---

# FilelogRefusedLogs

## Problem

The `filelog` receiver is rejecting log records. Usually malformed lines, broken multiline configs, or operator parsing failures.

## Impact

Node-level container logs are dropped before entering the pipeline. Affected pods lose log coverage on that node.

## Diagnosis

1. Check collector logs on the affected node for parser errors: `kubectl logs ds/logs-collector -n <ns> | grep -i filelog`.
1. Inspect sources under `/var/log/pods/` for unexpected formats.

## Resolution Steps

1. Fix the offending operator (regex/multiline) in the filelog config or exclude the noisy source.
1. Roll the DaemonSet: `kubectl rollout restart ds/logs-collector -n <ns>`.
