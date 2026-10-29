---
title: "Log volume dropped sharply"
description: "Alert: OTelLogsVolumeDropFast"
weight: 60
---

**Alert:** `OTelLogsVolumeDropFast`

## Problem

A cluster is exporting less than 20% of its 1-hour baseline volume. Measured on `otelcol_exporter_sent_log_records` — the drop is after processing, so this includes receiver outages, processor drops, and export failures.

Common causes:
- Silent collector pod crash on one or more nodes.
- Config change that filters out most traffic (over-aggressive filter processor).
- Sink outage causing all exports to fail (see [`OTelLogsExportingFailed`]({{< relref "/docs/operations/playbooks/logs/otellogsexportingfailed.md" >}})).
- Legitimate drop (traffic went quiet).

## Impact

Significant log data loss on the affected cluster. If the drop is silent, downstream alerts and dashboards show gaps.

## Diagnosis

1. Confirm the cluster and check if drop is per-node or cluster-wide:
   ```promql
   sum by (k8s_node_name) (rate(otelcol_exporter_sent_log_records{k8s_cluster_name="<cluster>"}[5m]))
   ```
1. If per-node: follow [`OTelLogsMissing`]({{< relref "/docs/operations/playbooks/logs/otellogsmissing.md" >}}) for each affected pod.
1. If cluster-wide:
   - Check for a correlated [`OTelLogsExportingFailed`]({{< relref "/docs/operations/playbooks/logs/otellogsexportingfailed.md" >}}) alert.
   - Review recent config changes (`kubectl rollout history ds/logs-collector -n fortlogs-logs`).
   - Check receiver-side rate — if also dropped, source has quieted; if normal, data is being lost between receiver and exporter.
1. Check `otelcol_processor_dropped_log_records` for any processor silently dropping records.

## Resolution Steps

1. If pod-level failure: restart affected pod. Find the pod via `k8s_node_name` from the drill-down, then:
   ```sh
   kubectl delete pod "$POD" -n fortlogs-logs
   ```
1. If config regression: roll back the most recent Helm release.
1. If sink-side: follow [`OTelLogsExportingFailed`]({{< relref "/docs/operations/playbooks/logs/otellogsexportingfailed.md" >}}).
1. If a processor is dropping too aggressively: fix the filter/transform rule in `openTelemetry.logsCollector` config.
1. Verify export rate recovers to within 80% of baseline.
