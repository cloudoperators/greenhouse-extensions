---
title: "Deadletter index flush is failing"
description: "Alert: OTelLogsDeadletterFlushFailing"
weight: 15
---

**Alert:** `OTelLogsDeadletterFlushFailing`

## Problem

The OpenSearch exporter can't write to the **deadletter** (on-error) index. The fallback that catches permanently-failed documents is itself failing.

Common causes:
- OpenSearch cluster is `red` or has shards blocked (disk watermark, allocation).
- Deadletter datastream missing or its backing index closed.
- Circuit breaker on OpenSearch (memory pressure).
- Network path from ingester to OpenSearch broken.

## Impact

**Critical.** Without Kafka, documents hitting a permanent error are now dropped entirely (no retry queue, no deadletter). With Kafka enabled, records stay in Kafka until this clears — follow quickly to avoid Kafka retention expiry.

## Diagnosis

1. Note `k8s_cluster_name` and `index` from the alert.
1. Confirm failure rate:
   ```promql
   sum by (index) (
     rate(opensearch_exporter_on_error_flush_failures_total{k8s_cluster_name="<cluster>"}[5m])
   )
   ```
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

1. **Disk watermark**: free space on OpenSearch nodes (delete snapshots, old indices via Index Management, or add capacity). The flood-stage watermark blocks all writes.
1. **Circuit breaker**: wait for memory to drain, or raise OpenSearch heap/shard limits. Escalate to the OpenSearch owner.
1. **Missing/closed deadletter datastream**: recreate it with the correct index template.
1. **Network**: verify DNS and reachability from an ingester pod:
   ```sh
   POD=$(kubectl get pods -n fortlogs-logs -l app.kubernetes.io/managed-by=opentelemetry-operator -o jsonpath='{.items[0].metadata.name}')
   kubectl exec "$POD" -n fortlogs-logs -c otc-container -- wget -S -O- https://<opensearch-endpoint>
   ```
1. After fix, verify flush failures stop:
   ```promql
   rate(opensearch_exporter_on_error_flush_failures_total[5m])
   ```

## Related

- [`OTelLogsDeadletterIndexGrowing`]({{< relref "/docs/operations/playbooks/logs/otellogsdeadletterindexgrowing.md" >}}) — root cause for documents hitting the deadletter in the first place.
- [`OTelLogsExportingFailed`]({{< relref "/docs/operations/playbooks/logs/otellogsexportingfailed.md" >}}) — primary export is failing.
