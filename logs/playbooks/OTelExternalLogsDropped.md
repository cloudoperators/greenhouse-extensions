---
title: OTelExternalLogsDropped
weight: 20
---

# OTelExternalLogsDropped

## Problem

The external collector (syslog and HTTP receivers) could not export log records on the exporter named in the alert and dropped them after its sending queue and retries. The `exporter` label names the path, for example a Kafka topic exporter.

## Impact

The dropped records are lost. Syslog and HTTP senders do not resend records the collector already accepted. If pods were killed (OOM), the records in their queues were lost too without being counted; the restarts bound that loss.

Records the receivers refuse (`otelcol_receiver_refused_log_records_total`) are a separate signal: the sender gets an error, and HTTP senders may retry them.

## Diagnosis

1. Check the external collector pods: `kubectl get pods -n <namespace> -l app.kubernetes.io/name=external-collector`. Restarts or OOM kills often come with this alert.
2. Look for the drops in the collector log: `kubectl logs -n <namespace> <pod> -c otc-container | grep -i "dropping data"`.
3. Check the destination of the exporter (Kafka brokers or OpenSearch) for errors, throttling or timeouts at the same time.

## Resolution Steps

1. Fix the destination or the connection to it.
2. If the pods are restarting, check their memory limit against the incoming volume and the queue size.
3. The alert clears 15 minutes after the last drop.
