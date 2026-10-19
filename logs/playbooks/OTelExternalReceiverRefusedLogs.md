---
title: OTelExternalReceiverRefusedLogs
weight: 20
---

# OTelExternalReceiverRefusedLogs

## Problem

A UDP or TCP receiver of the external collector (syslog over UDP, TCP or TLS) took log records from the network, but its pipeline refused them (`otelcol_receiver_refused_log_records_total`). This is usually the `memory_limiter` processor refusing data because the collector is above its soft memory limit. The HTTP receivers are not covered: they return an error to the sender, which can retry.

## Impact

Refused records are not exported. These senders get no error and do not resend them, so they are lost.

## Diagnosis

- Refusals per pod and receiver: `sum by (pod, receiver) (rate(otelcol_receiver_refused_log_records_total{job=~".*/opentelemetry-collector-external"}[5m]))` (this includes the HTTP receivers).
- Memory of the collector container against its limit, and the collector log for memory_limiter messages.
- A large `syslogConfig.udpAsync.maxQueueLength` raises memory use during bursts (about 313 MiB of buffers for 5000 slots).
- Exporter queue and send failures on the same pod: a slow Kafka or OpenSearch backs data up into memory.
- With the collector feature gate `receiverhelper.newReceiverMetrics`, some of these errors are counted in `otelcol_receiver_failed_log_records_total` instead.

## Resolution Steps

1. Raise `openTelemetry.externalCollector.resources.limits.memory`. The memory_limiter limits are a percentage of it. Also check the collector container for OOM kills: a kill during a burst loses the whole UDP queue, and no counter shows it.
2. If the exporters are backing up, fix the sink first (see `OTelExporterQueueFull`, `OTelLogsExportFailureRatioHigh`).
3. If the memory is taken by the UDP queue, lower `udpAsync.maxQueueLength`.
