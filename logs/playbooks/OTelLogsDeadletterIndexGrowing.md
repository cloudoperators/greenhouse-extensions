---
title: OTelLogsDeadletterIndexGrowing
weight: 20
---

# OTelLogsDeadletterIndexGrowing

## Problem

OpenSearch rejects documents permanently (for example a mapping conflict or a field limit), and the exporter writes them to the deadletter index (`logs_index_on_error`) instead. The `index` label is the index OpenSearch rejected them for, usually a backing index of a data stream, like `.ds-logs-000431` for an ingester named `logs` or `.ds-logs-datastream-000431` for the node log agents. The alert fires when this goes on for about an hour.

## Impact

The records are not in their regular index, so searches and dashboards there miss them. They are kept in the deadletter index with the error, so nothing is lost while the deadletter index accepts them (see `OTelLogsDeadletterFlushFailing`).

## Diagnosis

1. Find which collector and index:

    ```promql
    sum by (job, index, error_type, status) (increase(otelcol_opensearch_exporter_on_error_docs_total{job=~"<namespace>/.*"}[1h]))
    ```

2. Open the deadletter index in OpenSearch Dashboards. Its name is the exporter's `logs_index` plus `-deadletter`: `<name>-deadletter` for an ingester, `logs-datastream-deadletter`, `cronus-datastream-deadletter` or `storage-datastream-deadletter` for the node log agents, `alerts-datastream-deadletter` or `deployments-datastream-deadletter` for the external collector. Each document has an `error` object with the `type`, `reason` and `status` OpenSearch returned, next to the original record.

## Resolution Steps

1. Fix the cause the `error.reason` names: the index mapping or template, the field limit, or the log source that sends conflicting field types.
2. The alert clears 30 minutes after the last rejected document.
