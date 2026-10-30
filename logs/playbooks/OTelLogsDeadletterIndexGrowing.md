---
title: "Logs routed to deadletter index"
description: "Alert: OTelLogsDeadletterIndexGrowing"
weight: 45
---

**Alert:** `OTelLogsDeadletterIndexGrowing`

## Problem

The OpenSearch exporter is routing documents to the deadletter (on-error) index because of **permanent** indexing failures. The documents are safely captured in the fallback, but they are not reaching the intended index.

Common causes:
- `mapper_parsing_exception`: document fields conflict with the index mapping (new field with wrong type, or type drift).
- 400: malformed document (bad JSON, unexpected structure).
- `index_not_found_exception`: target datastream deleted or ILM-rolled-away before indexing.
- 401/403: credentials for the exporter are wrong/revoked.

## Impact

Logs are queryable only from the deadletter index, not their intended destination. Deadletter growth is unbounded until the root cause is fixed.

## Diagnosis

1. Identify affected `k8s_cluster_name` and `index` from alert labels.
1. Classify the error:
   ```promql
   sum by (error_class, error_type, status) (
     increase(opensearch_exporter_on_error_docs_total{k8s_cluster_name="<cluster>"}[1h])
   )
   ```
1. Confirm with permanent-error metric to see per-index detail:
   ```promql
   sum by (error_class, error_type, index, status) (
     rate(opensearch_exporter_permanent_errors_total{k8s_cluster_name="<cluster>"}[5m])
   )
   ```
1. Tail ingester logs for the OpenSearch error body:
   ```sh
   kubectl logs -l app.kubernetes.io/managed-by=opentelemetry-operator -n fortlogs-logs -c otc-container --tail=500 | grep -iE "error|rejected|mapper_parsing"
   ```

## Resolution Steps

1. **Mapping conflict (400 / `mapper_parsing_exception`)**: either update the OpenSearch index template to accept the field, or add a transform processor to drop/stringify the field in `openTelemetry.ingesterCollector` config. Example:
   ```yaml
   processors:
     transform:
       log_statements:
         - context: log
           statements:
             - set(log.attributes["bad_field_string"], String(log.attributes["bad_field"])) where log.attributes["bad_field"] != nil
             - delete_key(log.attributes, "bad_field") where log.attributes["bad_field"] != nil
   ```
1. **401/403**: rotate the credentials in `otel-basic-auth`; secret-reloader restarts collectors.
1. **`index_not_found_exception`**: verify the datastream exists and the ILM policy is correct; recreate the datastream if deleted.
1. After fix, verify no new documents land in the deadletter:
   ```promql
   rate(opensearch_exporter_on_error_docs_total[5m])
   ```
1. Optionally reprocess documents from the deadletter index back to the target index once mappings allow it.

## Related

- [`OTelLogsDeadletterFlushFailing`]({{< relref "/docs/operations/playbooks/logs/otellogsdeadletterflushfailing.md" >}}) — the deadletter itself is failing (worse).
- [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) — general export failures.
