---
title: "Logs are missing"
description: "Alert: OTelLogsMissing"
weight: 110
---

**Alert:** `OTelLogsMissing`

## Problem

A collector pod has not exported a single log record in the last 60 minutes. The alert fires per `region`, `k8s_node_name`, `pod`. Scope is **a single collector instance**, not the whole pipeline.

Possible causes (collector-local):
- Pod is in `CrashLoopBackoff` or `Error` state.
- Collector config references a secret/configmap that failed to mount.
- The pod has no sources on that node (no pods matching filelog `include` pattern).
- Pipeline deadlock from `block_on_overflow: true` combined with a stuck exporter queue.

## Impact

Logs from the affected node (or ingester shard) are not reaching the sink. Depending on the collector, this means a blind spot for everything on that node.

## Diagnosis

1. Note `k8s_node_name` and `pod` from the alert.
1. Find the pod from the alert's `pod` label (or by node):
   ```sh
   POD=<pod-from-alert>
   # or by node:
   POD=$(kubectl get pods -n fortlogs-logs -l app.kubernetes.io/instance=fortlogs-logs.logs -o jsonpath='{.items[0].metadata.name}')
   ```
1. Check pod state:
   ```sh
   kubectl get pod "$POD" -n fortlogs-logs -o wide
   kubectl describe pod "$POD" -n fortlogs-logs | tail -30
   ```
1. Check for restarts and OOMKilled containers.
1. Tail logs for a config load failure or receiver init error:
   ```sh
   kubectl logs "$POD" -n fortlogs-logs -c otc-container --tail=200
   kubectl logs "$POD" -n fortlogs-logs -c otc-container --previous --tail=200
   ```
1. Verify the node has log sources (if filelog receiver: `kubectl debug node/<node> ... ls /var/log/pods/`).
1. Check the [`OTelLogsExportFailureRatioHigh`]({{< relref "/docs/operations/playbooks/logs/otellogsexportfailureratiohigh.md" >}}) alert for the same cluster — queue could be stuck causing receiver backpressure.

## Resolution Steps

1. If pod is crashlooping, resolve the cause (fix secret mount, config error, resource limits) and let the operator restart.
1. If pod healthy but no sources exist on the node, verify by `kubectl get pods --field-selector spec.nodeName=<node>`. No action needed if node genuinely has no workloads.
1. If export queue is full, follow [`OTelLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/logs/otellogsexporterqueuefilling.md" >}}) first.
1. If stuck but no obvious cause, delete the pod — operator recreates it:
   ```sh
   kubectl delete pod "$POD" -n fortlogs-logs
   ```
1. Verify export resumes: `rate(otelcol_exporter_sent_log_records{pod="$POD"}[5m]) > 0`.
