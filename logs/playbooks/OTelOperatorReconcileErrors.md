---
title: "OTel Operator reconcile errors"
description: "Alert: OTelOperatorReconcileErrors"
weight: 120
---

**Alert:** `OTelOperatorReconcileErrors`

## Problem

The OpenTelemetry Operator is failing to reconcile `OpenTelemetryCollector` CRs. Scope is the operator deployment — the collectors themselves may still be running on the last-known-good config.

Common causes:
- Invalid CR spec (new config pushed that fails CRD validation).
- Admission webhook (operator's own) rejecting the CR.
- Missing RBAC after a cluster upgrade.
- Operator pod OOM or stuck in `ImagePullBackOff`.

## Impact

New config changes to collectors are not applied. Running collectors continue with their current config; they do not immediately break, but any Helm upgrade or CR edit is stuck.

## Diagnosis

1. Find operator pod:
   ```sh
   kubectl get pods -n fortlogs-logs -l app.kubernetes.io/name=opentelemetry-operator
   ```
1. Check pod state and recent restarts; look for OOM:
   ```sh
   kubectl describe pod <operator-pod> -n fortlogs-logs
   ```
1. Tail operator logs:
   ```sh
   kubectl logs <operator-pod> -n fortlogs-logs -c manager | grep -iE "error|reconcil|validation"
   ```
1. Identify which CR is failing:
   ```sh
   kubectl get otelcol -A
   kubectl describe otelcol <name> -n fortlogs-logs
   ```
   Check `Events` and `Status.Conditions` for the error message.

## Resolution Steps

1. If invalid spec: revert the recent change to the CR / Helm values.
1. If RBAC: compare the operator ClusterRole against the version-matching upstream chart; patch missing permissions.
1. If operator OOM: raise memory limits in the operator Deployment spec.
1. If webhook rejecting: check `kubectl get validatingwebhookconfigurations` and `MutatingWebhookConfiguration` for the operator's webhook; verify endpoints are reachable.
1. Verify reconcile succeeds: `rate(controller_runtime_reconcile_total{controller="opentelemetrycollector",result="error"}[5m])` returns to zero.
