---
title: WorkqueueDepth
weight: 20
---

# WorkqueueDepth

## Problem

The OTel Operator controller workqueue is growing. Reconciliation is slower than event arrival, often due to repeated errors or an overloaded operator.

## Impact

Collector CR changes take longer to apply. Combined with `ReconcileErrors`, the operator may be effectively stalled.

## Diagnosis

1. Check operator logs: `kubectl logs deploy/opentelemetry-operator -n <ns> | grep -i error`.
1. Review operator pod CPU/memory and recent CR churn: `kubectl top pod -n <ns>`.

## Resolution Steps

1. Resolve the underlying reconcile errors first.
1. If the operator is resource-starved, raise requests/limits or scale the deployment.
1. Restart as a last resort.
