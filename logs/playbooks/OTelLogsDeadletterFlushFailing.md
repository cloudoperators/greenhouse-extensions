---
title: "Deadletter index flush is failing"
description: "Alert: OTelLogsDeadletterFlushFailing"
weight: 15
---

**Alert:** `OTelLogsDeadletterFlushFailing`

## Problem

The OpenSearch exporter can't deliver documents to the **deadletter** (on-error) index. The fallback that catches permanently-failed documents is itself dropping records.

The `failure_stage` label pinpoints where in the pipeline the drop happens:
- `envelope_marshal` — serializing the deadletter envelope failed (bad field types, encoding).
- `enqueue` — in-memory queue to the deadletter indexer refused the record (overflow).
- `item_transport` — HTTP/gRPC call to OpenSearch failed per-item (network, TLS, 5xx).
- `item_indexing` — OpenSearch accepted the request but rejected the item (mapping conflict in the deadletter index itself, 400).
- `indexer_create` — the per-batch indexer couldn't be instantiated; **all pending docs for that batch are dropped**.

## Impact

**Critical.** Without Kafka, documents hitting a permanent error are now dropped entirely (no retry queue, no deadletter). With Kafka enabled, records stay in Kafka until this clears — follow quickly to avoid Kafka retention expiry.

## Diagnosis

1. Note `k8s_cluster_name`, `index`, and `failure_stage` from the alert.
1. Break down failures by stage:
   ```promql
   sum by (index, failure_stage) (
     rate(otelcol_opensearch_exporter_on_error_flush_failures_total{k8s_cluster_name="<cluster>"}[5m])
   )
   ```
1. Pick investigation path based on `failure_stage`:
   - `envelope_marshal` / `item_indexing` → mapping or data problem on the **deadletter** index. Check its mapping in Dev Tools.
   - `item_transport` / `indexer_create` → sink-side health, auth, or network.
   - `enqueue` → deadletter indexer queue is saturated; check sink throughput.
1. In OpenSearch Dev Tools:
   ```
   GET _cluster/health?pretty
   GET _cat/indices/*deadletter*?v
   GET _cat/allocation?v
   ```
   Look for: cluster status != green, `unassigned_shards > 0`, disk > 85%.
1. Tail ingester logs for the specific error:
   ```sh
   kubectl logs -l app.kubernetes.io/managed-by=opentelemetry-operator -n fortlogs-logs -c otc-container --tail=500 | grep -iE "flush|circuit_breaking|cluster_block|timeout"
   ```

## Resolution Steps

1. **`envelope_marshal` / `item_indexing`**: fix the deadletter index mapping (update index template) or the processor that produces the envelope. If a specific field is the culprit, drop/stringify it before export (see [`OTelLogsDeadletterIndexGrowing`]({{< relref "/docs/operations/playbooks/logs/otellogsdeadletterindexgrowing.md" >}}) for the transform-processor example).
1. **`item_transport`**: sink-side issue — disk watermark (free space on OpenSearch nodes), circuit breaker (raise heap, escalate to OpenSearch owner), or network (verify DNS and reachability):
   ```sh
   POD=$(kubectl get pods -n fortlogs-logs -l app.kubernetes.io/managed-by=opentelemetry-operator -o jsonpath='{.items[0].metadata.name}')
   kubectl exec "$POD" -n fortlogs-logs -c otc-container -- wget -S -O- https://<opensearch-endpoint>
   ```
1. **`indexer_create`**: the exporter couldn't open a bulk indexer at all — nearly always auth or TLS. Rotate `otel-basic-auth` secret and let secret-reloader restart collectors.
1. **`enqueue`**: downstream drain is too slow. Resolve underlying transport/indexing problems first; queue drains on its own.
1. After fix, verify flush failures stop:
   ```promql
   sum by (failure_stage) (rate(otelcol_opensearch_exporter_on_error_flush_failures_total[5m]))
   ```

## Related

- [`OTelLogsDeadletterIndexGrowing`]({{< relref "/docs/operations/playbooks/logs/otellogsdeadletterindexgrowing.md" >}}) — root cause for documents hitting the deadletter in the first place.
- [`OTelLogsExportingFailed`]({{< relref "/docs/operations/playbooks/logs/otellogsexportingfailed.md" >}}) — primary export is failing.
