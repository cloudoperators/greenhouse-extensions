---
title: OTelLogsMissing
weight: 20
---

# OTelLogsMissing

## Problem

Audit OTel Collectors on affected nodes are not shipping log records for 2+ hours. Likely causes: collector crash, pipeline stall, sink outage, credential drift.

## Impact

Audit data gaps on affected nodes. PCI-DSS compliance incident until coverage restored and backfilled.

## Diagnosis

1. Check pod state: `kubectl get pods -n <ns> -o wide | grep audit-logs-collector`.
1. Inspect logs: `kubectl logs <pod> -c otc-container -n <ns>`.
1. Verify sink reachability and credentials.

## Resolution Steps

1. Restart affected pod: `kubectl delete pod <pod> -n <ns>`.
1. If problem persists, check for CrashLoopBackoff, image pull errors, secret mounting.
1. Escalate to sink owner if backend is the issue.
