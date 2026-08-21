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

## Resolution Steps
