---
title: FilelogRefusedLogs
weight: 20
---

# FilelogRefusedLogs

## Problem

The audit `filelog` receiver is rejecting log records. Usually malformed lines, broken multiline configs, or operator parsing failures.

## Impact

Node-level audit sources are dropped before entering the pipeline. Affected audit sources lose coverage on that node.

## Diagnosis

1. Identify affected node from alert labels.
1. Check collector logs: `kubectl logs ds/audit-logs-collector -n <ns> -c otc-container | grep -i filelog`.
1. Inspect audit file sources on the node for unexpected formats or malformed entries.

## Resolution Steps

1. Fix the offending operator or add exclude patterns for noisy audit sources.
1. Apply: `kubectl rollout restart ds/audit-logs-collector -n <ns>`.
1. Verify alert clears within 5 minutes.
