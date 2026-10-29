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

1. Inspect collector logs: `kubectl logs <collector-pod> -n <ns> | grep -i refused`.
1. Identify the receiver and the sender. Check recent config or client changes.

## Resolution Steps

Fix the sender payload or adjust receiver config (allowed metric types, limits). Restart the collector to clear transient state if needed.
