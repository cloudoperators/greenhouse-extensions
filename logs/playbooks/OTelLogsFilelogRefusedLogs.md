---
title: "Filelog receiver is refusing logs"
description: "Alert: OTelLogsFilelogRefusedLogs"
weight: 40
---

**Alert:** `OTelLogsFilelogRefusedLogs`

## Problem

The `filelog` receiver is rejecting log records on one or more collector pods. Common causes:
- Malformed lines that no operator in the chain can parse.
- Multiline operator pattern mismatch (continuation lines treated as new records).
- Operator timestamp/severity parsers rejecting unexpected formats.
- `max_log_size` or `max_concurrent_files` limits hit on noisy nodes.

## Impact

Container logs under `/var/log/pods/` on affected nodes are **dropped at the receiver** and never enter the pipeline. Downstream exporters, queues, and sinks are not involved.

## Diagnosis

1. Identify the affected node and cluster from alert labels (`k8s_node_name`, `k8s_cluster_name`).
1. Tail collector logs across the DaemonSet, filtered to the affected node:
   ```sh
   kubectl logs ds/logs-collector -n fortlogs-logs -c otc-container --prefix | grep -E "filelog|operator|parse"
   ```
   Or target the specific pod on the node:
   ```sh
   POD=$(kubectl get pods -n fortlogs-logs -l app.kubernetes.io/instance=fortlogs-logs.logs -o jsonpath='{.items[0].metadata.name}')
   kubectl logs "$POD" -n fortlogs-logs -c otc-container | grep -iE "filelog|operator|parse"
   ```
1. Note the operator name reporting errors (`regex_parser`, `recombine`, `time_parser`, etc.).
1. Inspect a sample of the raw lines on the node for the offending source:
   ```sh
   kubectl debug node/<node> -it --image=busybox -- chroot /host ls /var/log/pods/
   ```

## Resolution Steps

1. If a single source is noisy, add an `exclude` pattern to the filelog receiver (`openTelemetry.logsCollector` filelog config in values).
1. If a parser is misconfigured, fix the operator stanza (regex, multiline pattern, timestamp layout) in the collector config.
1. Roll the DaemonSet by re-applying the Helm release; the operator reconciles the config and restarts pods automatically. If needed, force restart:
   ```sh
   kubectl rollout restart ds/logs-collector -n fortlogs-logs
   ```
1. Verify refusal rate returns to zero: `rate(otelcol_receiver_refused_log_records{receiver="filelog"}[5m])`.
