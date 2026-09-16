---
title: OTelLogsDeadletterFlushFailing
weight: 20
---

# OTelLogsDeadletterFlushFailing

## Problem

The OpenSearch exporter is failing to write documents to the deadletter (on-error) index itself. This is a critical failure as the fallback mechanism designed to capture permanently failed documents is not indexing any records, is not working or some other reason.

## Impact

**CRITICAL**: Documents are being **dropped by the exporter**, this needs to be resolved quickly. This error indicates that neither the primary index nor the deadletter fallback is receiving the logs. As FortLogs uses Kafka there is no *immediate* loss of data, as log records are only marked as "consumed" when they have "successfully" been indexed in OpenSearch (in any index). **However** logs are retained only for a short time in Kafka -- so indexing needs to resume otherwise there is permanent loss of data.

## Diagnosis

### 1. Check Flush Failure Rate

Query Prometheus to see the rate of flush failures:

```promql
rate(opensearch_exporter_on_error_flush_failures_total{k8s_cluster_name="<cluster>"}[5m])
```

Check which indices are affected:

```promql
sum by (index) (
  increase(opensearch_exporter_on_error_flush_failures_total{k8s_cluster_name="<cluster>"}[1h])
)
```

### 2. Check OpenSearch Health

The deadletter index flush failures are often caused by OpenSearch cluster issues. Run the following in the **OpenSearch Dashboards Dev Tools** console:

**Check cluster health:**

```
GET _cluster/health?pretty
```

Look for:
- `status: red` or `yellow` - cluster degraded
- `unassigned_shards > 0` - shard allocation problems
- `active_shards_percent_as_number < 100` - incomplete shard coverage

**Check index-level status:**

```
GET _cat/indices/*error*?v
```

### 3. Check OpenSearch Resource Constraints

**Disk space** — run in Dev Tools:

```
GET _cat/allocation?v
```

If disk usage is >85%, OpenSearch may block writes (flood stage watermark).

**Memory/CPU:**

```bash
kubectl top pods -n <opensearch-namespace>
```

### 4. Examine Collector Logs

Check OTel Collector logs for detailed flush error messages:

```bash
kubectl logs <collector-pod> -n <namespace>
```

Common error patterns:
- **`circuit_breaking_exception`**: OpenSearch is protecting itself from memory exhaustion
- **`cluster_block_exception`**: Writes blocked due to disk watermark or other cluster policy
- **`timeout`**: OpenSearch not responding in time
- **Connection errors**: Network issues or OpenSearch pods unreachable

## Resolution Steps

### For Disk Space Issues

1. **Free up disk space immediately**:
   - Delete old indices or snapshots via Index Management in OpenSearch Dashboards
   - Reduce replica count temporarily
   - Add storage capacity to OpenSearch nodes

2. **Reset flood stage watermark** once space is freed — run in Dev Tools:

```
PUT _cluster/settings
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.flood_stage": "99%"
  }
}
```

### For Network/Connectivity Issues

1. Verify OpenSearch endpoint is reachable from the collector pods:

```bash
kubectl exec -n <namespace> <collector-pod> -- curl -I https://<opensearch-endpoint>
```

2. Check DNS resolution:

```bash
kubectl exec -n <namespace> <collector-pod> -- nslookup <opensearch-service>
```

3. Review NetworkPolicies that might block traffic

### After Resolution

1. Verify flush failures stop:

```promql
rate(opensearch_exporter_on_error_flush_failures_total[5m])
```

2. Confirm OpenSearch cluster health is green via Dev Tools:

```
GET _cluster/health?pretty
```

## Related Alerts

- `OTelLogsDeadletterIndexGrowing` - Documents successfully reaching deadletter (less severe)
- `LogsExportingFailed` - General export failures
- OpenSearch cluster alerts (if available) - disk, memory, shard allocation
