---
title: Audit logs are Missing
weight: 20
---

# OTelLogsMissing

## Problem

Audit OTel Collectors on affected nodes are not shipping log records for 2 hours. Likely causes: collector crash, pipeline stall, sink outage, or credential drift.

## Impact

Audit data gaps on the affected nodes. For PCI-DSS workloads this is a compliance incident until coverage is restored and backfilled where possible.

## Diagnosis

1. Check pod state: `kubectl get pods -n <ns> -o wide | grep audit`.
1. Inspect logs of the suspect pod: `kubectl logs <pod> -c otc-container -n <ns>`.
1. Verify sink reachability and credentials.

## Resolution Steps

1. Restart the affected pod: `kubectl delete pod <pod> -n <ns>`.
1. If the problem persists, follow the operator-level checks (CrashLoopBackoff, image pull, secrets) and escalate to the sink owner.
