---
title: "Log volume is decreasing"
description: "Alert: OTelLogsDecreasing"
weight: 70
---

**Alert:** `OTelLogsDecreasing`

## Problem

Export volume on a cluster has dropped to 1/4 of the baseline from 2 hours ago (sustained 2h). This measures `otelcol_exporter_sent_log_records`, so the drop is at the exporter — either source is quieter or something upstream is blocking.

Common causes:
- A chatty workload was removed, scaled down, or had its log level raised to WARN/ERROR.
- Receiver outage on one or more nodes (see [`OTelLogsMissing`]({{< relref "/docs/operations/playbooks/logs/otellogsmissing.md" >}})).
- Partial sink outage causing failover; sent-rate drops when retries pile up.
- Planned maintenance window.

## Impact

If the drop is legitimate (less traffic), none. If it's a silent failure, there is a logging blind spot that other alerts may not catch.

## Diagnosis

1. Confirm which cluster is affected (`k8s_cluster_name`).
1. Check whether the drop is uniform across nodes or isolated:
   ```promql
   sum by (k8s_node_name) (rate(otelcol_exporter_sent_log_records{job=~".*/opentelemetry-collector-logs"}[10m]))
   ```
1. If isolated, follow [`OTelLogsMissing`]({{< relref "/docs/operations/playbooks/logs/otellogsmissing.md" >}}) for the affected pods.
1. If cluster-wide, check for recent deploys or scaling events in top sources (OpenSearch query, group by namespace, prior 24h).
1. Check sink health ([`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) — if also firing, exports are failing not just quieter).

## Resolution Steps

1. If isolated collector failure: restart the affected pod and verify logs resume.
1. If uniform drop and sink is unhealthy: follow [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}).
1. If uniform drop and sink is healthy: contact the owners of the formerly-noisy workloads to confirm the drop is intentional.
1. If drop is intentional and recurring, document the baseline shift and mute the alert for the maintenance window.
