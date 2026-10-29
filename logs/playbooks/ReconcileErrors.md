---
title: ReconcileErrors
weight: 20
---

# ReconcileErrors

## Problem

The OTel Operator is failing to reconcile `OpenTelemetryCollector` CRs. Common causes: invalid CR spec, missing RBAC, admission webhook failure, image pull errors.

## Impact

Collector changes are not applied. Config updates, scaling, or version bumps will not take effect until reconciliation succeeds.

## Diagnosis

1. Find operator pod: `kubectl get pods -n <ns> | grep opentelemetry-operator`.
1. Check operator logs: `kubectl logs <operator-pod> -n <ns> | grep -i error`.
1. Describe affected CR: `kubectl describe otelcol <name> -n <ns>` (check Events and Status).

## Resolution Steps

1. Fix the CR spec, RBAC, or image reference reported in the operator logs or CR status.
1. If stuck pods reported, delete them: `kubectl delete pod <pod> -n <ns>`.
1. Verify reconciliation succeeds: watch CR status with `kubectl get otelcol <name> -n <ns> -w`.
