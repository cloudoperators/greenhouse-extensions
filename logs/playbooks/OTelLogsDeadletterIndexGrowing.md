---
title: OTelLogsDeadletterIndexGrowing
weight: 20
---

# OTelLogsDeadletterIndexGrowing

## Problem

Documents are being routed to the OpenSearch deadletter (on-error) index (datastream) due to permanent indexing failures. This means logs are not reaching their intended destination indices and are accumulating in the fallback, deadletter index.

## Impact

- Logs are effectively "lost" from their intended indices and queryable only from the deadletter index
- Root indexing issue is preventing normal log processing
- Deadletter index storage will grow unbounded if the issue persists

## Diagnosis

### 1. Check the Rate and Volume

Query Prometheus to see how many documents are hitting the deadletter index:

```promql
rate(opensearch_exporter_on_error_docs_total{k8s_cluster_name="<cluster>"}[5m])
```

Check which error types are most common:

```promql
sum by (error_class, error_type, status) (
  increase(opensearch_exporter_on_error_docs_total{k8s_cluster_name="<cluster>"}[1h])
)
```

### 2. Check for Permanent Errors

Inspect the permanent error metric to understand what's causing indexing failures:

```promql
sum by (error_class, error_type, index, status) (
  rate(opensearch_exporter_permanent_errors_total{k8s_cluster_name="<cluster>"}[5m])
)
```

Common permanent error causes:
- **400 errors**: Malformed documents, schema mismatches, or field type conflicts
- **403/401 errors**: Authentication or authorization failures
- **index_not_found_exception**: Target index (datastream) doesn't exist or was deleted
- **mapper_parsing_exception**: Document structure doesn't match index mapping

### 3. Examine Collector Logs

Check the OpenTelemetry Collector logs for detailed error messages:

```bash
kubectl logs -n <namespace> -l app.kubernetes.io/name=opentelemetry-collector --tail=500 | grep -i "error\|failed"
```

Look for patterns indicating:
- Mapping conflicts
- Rejected documents
- OpenSearch API error responses

## Resolution Steps

### For Schema/Mapping Issues (400 errors)

1. **Identify the problematic field(s)** from the error logs
2. **Update the OpenSearch index (datastream) mapping** to accommodate the field types, or
3. **Add a transform processor** in the OTel Collector config to fix/drop the problematic fields before export

Example processor to drop or "stringify+drop" a problematic field:

```yaml
processors:
  transform:
    log_statements:
      - context: log
        statements:
          # optional: stringify complex types so that data is not lost, instead put into a string type field.
          - set(log.attributes["problematic_field_string"], String(log.attributes["problematic_field"])) where log.attributes["problematic_field"] != nil
          # drop the field completely
          - delete_key(log.attributes, "problematic_field") where log.attributes["problematic_field"] != nil
          # drop more complex data types
          - delete_matching_keys(log.attributes, "^problematic_field\\..*")
```

### For Authentication/Authorization Issues (401/403 errors)

1. Verify the OpenSearch credentials secret is correct.
2. Check that the service account or user has the necessary permissions in OpenSearch
3. Rotate credentials if they've expired or been revoked

### For Missing Index (datastream) Issues

1. Verify the target index (datastream) exists in OpenSearch
2. Check index (datastream) lifecycle policies that may have deleted the index (datastream)
3. Create the missing index (datastream) with appropriate mappings if needed

### After Resolution

Once the root cause is fixed:

1. Monitor that new documents stop flowing to the deadletter index (datastream)
2. Decide whether to reprocess documents from the deadletter index (datastream)
3. Consider adding validation/transformation in the pipeline to prevent recurrence

## Related Alerts

- `OTelLogsDeadletterFlushFailing` - The deadletter index (datastream) itself is failing to write
- `OTelLogsExportFailureRatioHigh` - High export failure rate
- `LogsExportingFailed` - General export failures
