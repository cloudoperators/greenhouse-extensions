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

1. Identify affected node from alert labels.
1. Check collector logs: `kubectl logs ds/logs-collector -n <ns> -c otc-container | grep -i filelog`.
1. Inspect sources under `/var/log/pods/` on the node for unexpected formats or malformed entries.

## Resolution Steps

1. Fix the offending operator (regex/multiline) in the filelog config or add an exclude pattern for the noisy source.
1. Apply: `kubectl rollout restart ds/logs-collector -n <ns>`.
1. Verify alert clears within 5 minutes.
