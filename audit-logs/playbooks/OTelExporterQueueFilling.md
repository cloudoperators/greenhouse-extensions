---
title: OTelExporterQueueFilling / OTelExporterQueueFull
weight: 20
---

# OTelExporterQueueFilling / OTelExporterQueueFull

## Problem

The in-memory sending queue for an audit exporter is filling up. Filling fires at >80% capacity (info); Full fires at 100% (pipeline stalled). Failover connectors use `block_on_overflow: true`.

## Impact

At 80%: audit records are accumulating and the pipeline is under pressure. At 100%: the daemonset pod is stalled and no new audit records are processed on that node.

## Diagnosis

1. Check queue size vs capacity: `otelcol_exporter_queue_size` / `otelcol_exporter_queue_capacity` by exporter.
1. Correlate with `OTelLogsExportFailureRatioHigh` on the same `exporter` label.

## Resolution Steps

1. Resolve the underlying export failure (sink reachability, credentials, backend health).
1. If both failover legs are healthy, raise `sending_queue.queue_size` or add replicas.
1. Restart collector if the queue is stuck despite recovery.
