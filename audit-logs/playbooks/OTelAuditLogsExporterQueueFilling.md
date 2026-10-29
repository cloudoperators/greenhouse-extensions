---
title: "Audit exporter queue is filling or full"
description: "Alert: OTelAuditLogsExporterQueueFilling / OTelAuditLogsExporterQueueFull"
weight: 30
---

**Alert:** `OTelAuditLogsExporterQueueFilling / OTelAuditLogsExporterQueueFull`

## Problem

The audit exporter sending queue is under pressure:
- [`OTelAuditLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexporterqueuefilling.md" >}}): >80% capacity.
- [`OTelAuditLogsExporterQueueFull`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexporterqueuefilling.md" >}}): 100% capacity (receivers blocked).

With `block_on_overflow: true`, a full queue stops the pipeline on that pod.

Cause is nearly always downstream: sink can't keep up or is failing.

## Impact

- At 80%: queue drain is lagging. Audit records retained in memory.
- At 100%: receivers block, [`OTelAuditLogsMissing`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsmissing.md" >}}) will fire. **PCI-DSS: active compliance gap starting now.**

## Diagnosis

1. Identify exporter and node:
   ```promql
   topk(10, otelcol_exporter_queue_size{job=~".*/audit-collector-logs"} / otelcol_exporter_queue_capacity{job=~".*/audit-collector-logs"})
   ```
1. Check for correlated [`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}}) on same exporter.
1. Tail logs on the affected pod (node from alert label `k8s_node_name`):
   ```sh
   POD=$(kubectl get pods -n fortlogs-audit -l app.kubernetes.io/instance=fortlogs-audit.audit-logs -o jsonpath='{.items[0].metadata.name}')
   kubectl logs "$POD" -n fortlogs-audit -c otc-container | grep -iE "<exporter>|queue|rejected"
   ```
1. Check sink health (OpenSearch, Kafka).

## Resolution Steps

1. Resolve underlying export failures first ([`OTelAuditLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexportfailureratiohigh.md" >}})). Queue drains automatically on recovery.
1. If sink is healthy but queue full, raise `sending_queue.queue_size` in `auditLogs.logsCollector` config.
1. If Kafka: check audit ingester pods and consumer lag.
1. If stuck despite recovery, delete the affected pod to restart with fresh state:
   ```sh
   kubectl delete pod "$POD" -n fortlogs-audit
   ```
1. Verify utilization drops below 80%.
