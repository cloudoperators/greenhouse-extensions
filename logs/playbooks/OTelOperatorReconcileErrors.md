---
title: ReconcileErrors
weight: 20
---

# ReconcileErrors

## Problem

The OpenTelemetry operator of this install fails to reconcile OpenTelemetryCollector resources.

## Impact

Changes to the collector configuration or image are not rolled out, and collectors that need to be recreated are not.

## Diagnosis

1. Check the operator log: `kubectl logs -n <namespace> deploy/<release>-opentelemetry-operator | grep -i error`.
2. Check the collector resources: `kubectl get opentelemetrycollectors -n <namespace>` and `kubectl describe` the one named in the errors.

## Resolution Steps

1. Fix what the operator reports, usually an invalid collector spec or a missing secret or RBAC permission.
2. A single conflict error resolves itself on the next reconcile; the alert clears after 5 minutes without errors.
