---
title: ReceiverRefusedMetric
weight: 20
---

# ReceiverRefusedMetric

## Problem

An OTel receiver is rejecting metric points. Usually malformed metrics, unsupported types, or traffic that violates the receiver schema.

## Impact

Metrics from the affected receiver do not reach the pipeline. Dashboards and metric-driven alerts may show gaps.

## Diagnosis

1. Find affected pod: `kubectl get pods -n <ns> -l app.kubernetes.io/name=opentelemetry-collector`.
1. Inspect collector logs: `kubectl logs <collector-pod> -n <ns> -c otc-container | grep -i refused`.
1. Identify the receiver and sender; check recent config or client changes.

## Resolution Steps

1. Fix the sender payload (metric format, type) or adjust receiver config (allowed types, limits).
1. Apply: `kubectl rollout restart <collector-resource> -n <ns>`.
1. Verify metric refusal rate drops to zero.
