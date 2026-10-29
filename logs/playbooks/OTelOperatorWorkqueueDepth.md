---
title: "OTel Operator workqueue is growing"
description: "Alert: OTelOperatorWorkqueueDepth"
weight: 130
---

**Alert:** `OTelOperatorWorkqueueDepth`

## Problem

The OpenTelemetry Operator controller workqueue depth is increasing. Reconciliations are being enqueued faster than they are processed. Scope is the operator — collectors themselves still run on last-good config.

Common causes:
- Reconcile errors causing items to be re-enqueued repeatedly (see [`OTelOperatorReconcileErrors`]({{< relref "/docs/operations/playbooks/logs/oteloperatorreconcileerrors.md" >}})).
- Many simultaneous CR changes.
- Operator under-resourced (CPU throttling, memory pressure).

## Impact

Latency for applying CR changes grows. Combined with [`OTelOperatorReconcileErrors`]({{< relref "/docs/operations/playbooks/logs/oteloperatorreconcileerrors.md" >}}), the operator may be effectively stalled.

## Diagnosis

1. Check if [`OTelOperatorReconcileErrors`]({{< relref "/docs/operations/playbooks/logs/oteloperatorreconcileerrors.md" >}}) is also firing — if yes, follow it first.
1. Find operator pod and its resources:
   ```sh
   kubectl top pod -n fortlogs-logs -l app.kubernetes.io/name=opentelemetry-operator
   kubectl describe pod <operator-pod> -n fortlogs-logs | grep -A2 "Requests\|Limits"
   ```
1. Count recent CR changes:
   ```sh
   kubectl get otelcol -A --sort-by=.metadata.creationTimestamp
   ```
1. Review operator logs for repeated errors on the same object.

## Resolution Steps

1. Resolve any [`OTelOperatorReconcileErrors`]({{< relref "/docs/operations/playbooks/logs/oteloperatorreconcileerrors.md" >}}) first; most workqueue growth clears afterward.
1. If operator is CPU/memory starved: raise requests/limits in the operator Deployment.
1. If a single CR is churning (frequent updates): investigate why its config is being rewritten.
1. Last resort: restart the operator to clear the queue:
   ```sh
   kubectl rollout restart deploy/opentelemetry-operator -n fortlogs-logs
   ```
1. Verify queue depth returns to zero: `workqueue_depth{controller="opentelemetrycollector"}`.
