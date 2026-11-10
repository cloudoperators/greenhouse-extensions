---
title: ExternalCollectorMemoryHigh
weight: 20
---

# ExternalCollectorMemoryHigh

## Problem

An external collector pod (syslog and HTTP receivers) uses more than 8 GiB of resident memory. Healthy pods run at 0.3 to 2 GiB. The usual cause is an exporter that cannot deliver, most often a Kafka exporter that could not connect to the brokers after the pod started, so the incoming records pile up in its sending queue.

## Impact

The pod keeps growing until it is OOM killed or, without a memory limit, until the node runs out of memory. The records in its queues are lost when it is killed, and syslog senders do not resend them.

## Diagnosis

1. Find the pod and its memory: `kubectl top pods -n <namespace> -l app.kubernetes.io/name=external-collector`.
2. Find the exporter whose queue is filling:

    ```promql
    max by (pod, exporter) (otelcol_exporter_queue_size{job="<namespace>/opentelemetry-collector-external"})
    ```

3. Check that exporter for failures (`otelcol_exporter_send_failed_log_records_total`) and the collector log for connection errors:

    ```bash
    kubectl logs -n <namespace> <pod> -c otc-container | grep -iE "kafka|dropping data"
    ```

## Resolution Steps

1. Fix the destination or the connection to it (Kafka brokers reachable, DNS resolving the broker names).
2. If the destination is fine but the pod never connected, delete the pod so it starts with fresh connections.
3. If this happens after every restart, set `openTelemetry.externalCollector.resources` with a memory limit, so a stuck pod is restarted instead of taking the node down.
