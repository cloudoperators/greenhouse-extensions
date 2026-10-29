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

1. Query utilization: `otelcol_exporter_queue_size{exporter="<label>"} / otelcol_exporter_queue_capacity{exporter="<label>"}`.
1. Check for correlated `OTelLogsExportFailureRatioHigh` on same `exporter`.
1. Inspect logs: `kubectl logs <pod> -n <ns> -c otc-container | grep -i export`.

## Resolution Steps

1. Resolve underlying export failure (sink reachability, credentials, backend health).
1. If both failover routes healthy, raise `sending_queue.queue_size` in collector config.
1. Apply: `kubectl rollout restart ds/audit-logs-collector -n <ns>`.
1. If queue stuck after recovery, delete pod: `kubectl delete pod <pod> -n <ns>`.
