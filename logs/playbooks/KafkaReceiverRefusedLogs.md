---
title: KafkaReceiverRefusedLogs
weight: 20
---

# KafkaReceiverRefusedLogs

## Problem

The OTel ingester's Kafka receiver is refusing records: it consumes from Kafka but the downstream pipeline (OpenSearch bulk exporter) cannot process the batch, so the receiver returns an error. Kafka consumer offsets stop advancing for the affected topic, and lag grows.

The most common cause is an OpenSearch mapping mismatch — a document field whose type conflicts with the existing index mapping (`mapper_parsing_exception`). Other causes: OpenSearch cluster red/unavailable, exporter auth failure, or a persistent 4xx/5xx from the bulk API.

## Impact

New records for the affected topic are not written to OpenSearch. Kafka retains them (up to the topic's retention), so nothing is lost immediately, but ingestion lag grows and dashboards will show a gap. Once retention elapses, records are dropped permanently.

## Diagnosis

1. Identify the affected pipeline from alert labels: `namespace`, `receiver` (e.g. `kafka/audit`), `pod`.
2. Check the ingester pod logs for the specific bulk failure — the exception message includes the field path and type conflict:
   ```
   kubectl logs -n <namespace> <pod> | grep -iE "mapper_parsing|bulk.*fail|opensearch.*error" | tail -30
   ```
3. The target datastream name matches the `receiver` label after the `kafka/` prefix (e.g. `kafka/audit` → datastream `audit`, `kafka/syslog-audit` → `syslog-audit`, `kafka/storage` → `storage`).
4. Open OpenSearch Dashboards for the target cluster and go to **Management -> Dev Tools**. Inspect cluster and mapping:
   ```
   GET _cluster/health
   GET _data_stream/<datastream>
   GET <datastream>/_mapping
   GET <datastream>/_search?size=1
   ```
   For a mapping mismatch, compare the field's mapped type against the value the ingester is trying to write (from step 2). `_data_stream/<name>` also lists the currently-active backing index (`.ds-<name>-000###`) if you need to inspect it directly.
5. Confirm the Kafka consumer group is stuck (offset not advancing) via the Kafka lag dashboard for the ingester's group.

## Resolution Steps

- **Mapping mismatch (most common):** field types on an existing backing index cannot be changed in place. Patch the **index template** so future backing indices pick up the correct mapping, then roll the datastream.
  - In Dashboards: **Management -> Index Management -> Index Templates**, edit the template that governs the datastream, adjust the field mapping, and save.
  - Then roll the datastream in Dev Tools: `POST <datastream>/_rollover` — this cuts a new backing index (`.ds-<name>-<next>`) using the updated template.
  - The ingester resumes writing into the new backing index. Old backing indices keep the old mapping but stay readable.
  - If the producer is emitting an *unexpected* field type (e.g. object vs scalar), consider fixing the producer instead of accommodating it in the mapping.
- **OpenSearch unavailable:** resolve the underlying cluster problem (see OpenSearch playbooks). The ingester will drain the Kafka backlog automatically once bulk writes succeed.
- **Auth failure:** rotate credentials; verify the ingester's failover users still exist and have write permission on the target datastream.
- Once resolved, monitor `otelcol_receiver_accepted_log_records_total` and Kafka consumer lag returning to steady state.
