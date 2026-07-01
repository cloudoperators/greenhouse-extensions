---
title: OTelCollectorMemoryHigh
weight: 20
---

# OTelCollectorMemoryHigh

## Problem

The OTel collector RSS memory on a node has exceeded 1.5 GiB. The `memory_limiter` processor is configured at 80% limit / 30% spike. When RSS approaches this threshold, the processor will start refusing incoming log records to protect the process from OOM.

## Impact

If memory continues to grow, the `memory_limiter` will start dropping log records with `otelcol_processor_refused_log_records_total` increasing. In the worst case the pod is OOM-killed.

## Diagnosis

## Resolution Steps
