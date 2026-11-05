---
title: "Kafka Consumer Lag Retention Risk"
description: "Projected consumer drain time exceeds half of the topic retention — messages may expire before being consumed."
summary: ""
date: 2026-11-05T09:00:00+02:00
lastmod: 2026-11-05T09:00:00+02:00
draft: false
weight: 31
toc: true
params:
  seo:
    title: ""
    description: ""
    canonical: ""
    robots: ""
---

## Problem

A consumer group's projected drain time (lag ÷ produce rate) has exceeded 50% of the topic retention for more than 30 minutes, and lag is still growing.

## Impact

- Messages are at risk of being deleted by Kafka retention before being consumed — **permanent data loss**.
- For audit topics (`syslog-audit`), this breaks PCI-DSS evidence retention.
- Unlike `KafkaConsumerLagTooHigh` (warning), this alert indicates loss is imminent, not just that the consumer is slow.

## Diagnosis

1. Note `consumergroup`, `topic`, and `namespace` from the alert.
2. Confirm lag is still growing (not a transient spike):

   ```
   sum by (topic, consumergroup) (
     kafka_consumergroup_lag{namespace="<ns>", topic="<topic>", consumergroup="<group>"}
   )
   ```

3. Compare projected drain time against topic retention:

   ```
   kubectl get kafkatopic <topic> -n <ns> -o jsonpath='{.spec.config.retention\.ms}'
   ```

4. Identify the consumer — usually an OTel ingester (`logs-ingester-<name>`) or an external SIEM consumer. Check its downstream sink:

   ```
   sum by (failure_stage) (rate(otelcol_opensearch_exporter_on_error_flush_failures_total{job=~".*ingester.*"}[5m]))
   ```

   If non-zero, cross-reference [`OTelLogsDeadletterFlushFailing`]({{< relref "/docs/operations/playbooks/logs/otellogsdeadletterflushfailing.md" >}}).

## Solution

Priority: unblock the consumer first, buy time second.

- **Downstream sink unhealthy (OpenSearch slow/rejecting):** follow [`OTelLogsDeadletterFlushFailing`]({{< relref "/docs/operations/playbooks/logs/otellogsdeadletterflushfailing.md" >}}) and [`OTelLogsExportingFailed`]({{< relref "/docs/operations/playbooks/logs/otellogsexportingfailed.md" >}}). Ingester drains automatically once sink recovers.
- **Consumer under-provisioned:** scale ingester replicas (parallelism caps at topic partition count), raise CPU/mem, or bump `num_sender`.
- **Producer spike:** throttle at the source, or temporarily extend retention to buy time:

   ```
   kubectl patch kafkatopic <topic> -n <ns> --type merge \
     -p '{"spec":{"config":{"retention.ms":"172800000"}}}'   # 48h
   ```

   Reset once lag recovers.
- **Retention expiry unavoidable:** capture evidence (partitions, offset ranges) before messages age out and raise an incident.

## Threshold

The threshold is computed per topic at chart-render time as `retention.ms / 2`. Change the topic's `retention` in the kafka plugin values (e.g. in `topics.<name>.retention`) to adjust it — no separate monitoring knob exists.

Confirm the alert clears once drain time drops back below the threshold and lag stops growing.
