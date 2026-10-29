---
title: "OTel receiver is refusing metrics"
description: "Alert: OTelLogsReceiverRefusedMetric"
weight: 150
---

**Alert:** `OTelLogsReceiverRefusedMetric`

## Problem

An OTel receiver is rejecting metric points. In the `logs` plugin, metrics typically come from:
- `prometheus` receiver scraping self-telemetry and other PodMonitors.
- `otlp` receiver (if enabled) accepting pushed metrics.

Common causes: unsupported metric type, label cardinality explosions, malformed exposition format.

## Impact

Metrics from the rejected scrapes are missing. Dashboards and alerts based on those metrics show gaps, but logs flow is **unaffected**.

## Diagnosis

1. Tail metrics-collector logs:
   ```sh
   kubectl logs deploy/metrics-collector -n fortlogs-logs -c otc-container | grep -iE "refused|invalid|metric"
   ```
1. Identify the scrape target or OTLP sender from the error context.
1. If `prometheus` receiver: curl the target directly to inspect exposition format.

## Resolution Steps

1. Fix the sender/target exposition (correct metric type declaration, bounded labels).
1. If the receiver config is too strict, adjust `allowed_metric_types` or label limits in values.yaml.
1. Reconcile via Helm.
1. Verify: `rate(otelcol_receiver_refused_metric_points[5m])` returns to zero.
