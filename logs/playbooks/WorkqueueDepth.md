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

1. Find operator deployment: `kubectl get deploy -n <ns> | grep opentelemetry-operator`.
1. Check operator logs for repeated errors: `kubectl logs deploy/<operator-deploy> -n <ns> | grep -i error`.
1. Review operator pod resource usage: `kubectl top pod -n <ns> -l app.kubernetes.io/name=opentelemetry-operator`.
1. Check recent CR churn: `kubectl get otelcol --all-namespaces --sort-by=.metadata.creationTimestamp`.

## Resolution Steps

1. Resolve the underlying reconcile errors first (see `ReconcileErrors`).
1. If the operator is resource-starved, raise requests/limits in the operator deployment.
1. If overloaded by CR volume, consider splitting collectors across namespaces or reducing reconcile frequency.
1. As a last resort, restart: `kubectl rollout restart deploy/<operator-deploy> -n <ns>`.
