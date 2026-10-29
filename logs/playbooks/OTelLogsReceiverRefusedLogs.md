---
title: "OTel receiver is refusing logs"
description: "Alert: OTelLogsReceiverRefusedLogs"
weight: 140
---

**Alert:** `OTelLogsReceiverRefusedLogs`

## Problem

A non-filelog OTel receiver on the `logs` DaemonSet is rejecting log records. The `receiver` label identifies which one:
- `syslog` / `syslog_tls` — RFC5424/RFC3164 parse failures or TCP connection resets.
- `k8s_events` — API server throttling or RBAC rejection.
- `journald` — unit filter or priority mismatch, journal cursor issues.
- `otlp` — payload size exceeds `max_recv_msg_size_mib` or TLS handshake failures.

## Impact

Records from the affected receiver are **dropped at ingest** on affected nodes. Other receivers on the same collector are unaffected.

## Diagnosis

1. Note the `receiver` and `k8s_cluster_name` labels from the alert.
1. Tail collector logs for the receiver name:
   ```sh
   kubectl logs ds/logs-collector -n fortlogs-logs -c otc-container | grep -i <receiver>
   ```
1. For `syslog`: check sender device clock, syslog format (RFC5424 vs 3164 vs Cisco IOS), and TLS cert validity if `syslog_tls`.
1. For `k8s_events`: verify the collector ServiceAccount has `watch` on `events` (`kubectl auth can-i watch events --as=system:serviceaccount:fortlogs-logs:<sa>`).
1. For `otlp`: verify client is sending to the correct port and payload size.

## Resolution Steps

1. Fix the sender if it's producing invalid payloads (format, size, rate).
1. Adjust the receiver config in values.yaml if the sender output is legitimate but mismatched (e.g., add a new syslog parser variant, raise `max_recv_msg_size_mib`).
1. Reconcile via Helm; verify operator restarts the collector pods.
1. Confirm refusal rate drops: `sum by (receiver) (rate(otelcol_receiver_refused_log_records{job=~".*/opentelemetry-collector-logs"}[5m]))`.
