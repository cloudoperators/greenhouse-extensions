---
title: OTelLogsDeadletterFlushFailing
weight: 20
---

# OTelLogsDeadletterFlushFailing

## Problem

Documents that OpenSearch rejected permanently could not be written to the deadletter index either. The `failure_stage` label says where it failed: `enqueue`, `item_transport` or `item_indexing` (the deadletter write itself), `indexer_create`, `envelope_marshal` or `drain_timeout` (at shutdown).

## Impact

These documents are dropped. They are neither in their regular index nor in the deadletter index.

## Diagnosis

1. Find which collector, deadletter index and stage:

    ```promql
    sum by (job, index, failure_stage) (increase(otelcol_opensearch_exporter_on_error_flush_failures_total{job=~"<namespace>/.*"}[1h]))
    ```

2. Check the deadletter index in OpenSearch: does it exist, is it writable (not read-only, not over its shard or disk limits), and may the exporter's user write to it.
3. For `item_transport`, check OpenSearch for timeouts or rejections at the same time; `OTelLogsDeadletterIndexGrowing` and the export failure alerts usually fire as well.

## Resolution Steps

1. Fix the deadletter index or the user's permissions on it, or the OpenSearch problem behind the transport errors.
2. Fix the cause of the rejections themselves, see `OTelLogsDeadletterIndexGrowing`.
