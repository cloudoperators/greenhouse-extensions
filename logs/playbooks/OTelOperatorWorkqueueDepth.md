---
title: WorkqueueDepth
weight: 20
---

# WorkqueueDepth

## Problem

The OpenTelemetry operator's `opentelemetrycollector` work queue has not been empty once in the last 20 minutes. Normally it fills for a minute or two after a change and drains again.

## Impact

Reconciles are stuck or slow, so collector changes are not applied.

## Diagnosis

1. Check the operator pod and its log: `kubectl get pods -n <namespace> | grep operator`, then `kubectl logs -n <namespace> deploy/<release>-opentelemetry-operator`.
2. Look for repeated reconcile errors (see ReconcileErrors) or API server timeouts.

## Resolution Steps

1. Fix the cause in the operator log.
2. If the operator is hung without errors, restart it: `kubectl rollout restart -n <namespace> deploy/<release>-opentelemetry-operator`.
