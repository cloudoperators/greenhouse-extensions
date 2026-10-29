---
title: "Exporter queue is filling or full"
description: "Alert: OTelLogsExporterQueueFilling / OTelLogsExporterQueueFull"
weight: 30
---

**Alert:** `OTelLogsExporterQueueFilling / OTelLogsExporterQueueFull`

## Problem

The in-memory sending queue (`sending_queue`) for an exporter is under pressure:
- [`OTelLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/logs/otellogsexporterqueuefilling.md" >}}): >80% of capacity (info).
- [`OTelLogsExporterQueueFull`]({{< relref "/docs/operations/playbooks/logs/otellogsexporterqueuefilling.md" >}}): 100% capacity (pipeline stalled).

The failover connectors are configured with `block_on_overflow: true`. When a queue hits 100%, the collector stops accepting new records from receivers.

Fundamental cause is almost always a downstream problem: the exporter can't drain to the sink fast enough. Possible reasons:
- Sink is slow or returning retriable errors (see [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}})).
- Both failover legs degraded.
- Queue size too small for current burst volume.
- Backpressure from Kafka (no consumers / lag).

## Impact

- At 80%: pressure building. If export failures persist, Full will follow.
- At 100%: receivers block, pod effectively stops processing. [`OTelLogsMissing`]({{< relref "/docs/operations/playbooks/logs/otellogsmissing.md" >}}) likely to fire shortly after.

## Diagnosis

1. Identify the exporter and node:
   ```promql
   topk(10, otelcol_exporter_queue_size / otelcol_exporter_queue_capacity)
   ```
1. Check for correlated [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) on the same exporter.
1. Tail collector logs on the affected pod (node from alert label `k8s_node_name`):
   ```sh
   POD=$(kubectl get pods -n fortlogs-logs -l app.kubernetes.io/instance=fortlogs-logs.logs -o jsonpath='{.items[0].metadata.name}')
   kubectl logs "$POD" -n fortlogs-logs -c otc-container | grep -iE "<exporter>|queue|rejected"
   ```
1. Check sink health (OpenSearch cluster, Kafka broker state and consumer lag).

## Resolution Steps

1. Resolve underlying export failures first (follow [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}})). The queue drains automatically once exports succeed.
1. If both failover legs are healthy but queue still full, raise `sending_queue.queue_size` in `openTelemetry.logsCollector` config (requires Helm reconcile).
1. If Kafka: check consumer lag and ingester pod health; the queue only drains as fast as consumers pull.
1. If queue stays stuck after sink recovery, delete the affected pod to force a fresh state:
   ```sh
   kubectl delete pod "$POD" -n fortlogs-logs
   ```
1. Verify utilization drops below 80%: `otelcol_exporter_queue_size / otelcol_exporter_queue_capacity`.
