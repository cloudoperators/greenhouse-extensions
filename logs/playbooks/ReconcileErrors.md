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

1. Check operator logs:
   1. Get pod name of the operator `k get pods -n fortlogs-logs | rg logs-opentelemetry-operator`
   1. `kubectl logs <logs-operator> -n <ns> | grep -i error`.

## Resolution Steps

1. Fix the CR spec, RBAC, or image reference reported by the operator.
1. Delete stuck pods if a lingering replica is reported, then confirm reconciliation succeeds.
