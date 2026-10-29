---
title: OTelExporterQueueFilling / OTelExporterQueueFull
weight: 20
---

# OTelExporterQueueFilling / OTelExporterQueueFull

## Problem

The in-memory sending queue for an exporter is filling up. `OTelExporterQueueFilling` fires at >80% capacity (info). `OTelExporterQueueFull` fires at 100% capacity (pipeline stalled).

The failover connectors are configured with `block_on_overflow: true`. When the queue is full, the collector stops processing new log records.

## Impact

At 80%: log records are accumulating and the pipeline is under pressure. At 100%: the daemonset pod is stalled and no new logs are being processed on the affected node.

## Diagnosis

1. Check queue size vs capacity: `otelcol_exporter_queue_size` / `otelcol_exporter_queue_capacity` by exporter.
1. Correlate with `OTelLogsExportFailureRatioHigh` on the same `exporter` label.

## Resolution Steps

1. Resolve the underlying export failure (sink reachability, credentials, backend health).
1. If both failover routes are healthy, raise `sending_queue.queue_size` or add replicas.
1. Restart collector if the queue is stuck despite recovery.
