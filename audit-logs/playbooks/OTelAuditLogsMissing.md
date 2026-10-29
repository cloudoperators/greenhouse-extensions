---
title: "Audit logs are missing"
description: "Alert: OTelAuditLogsMissing"
weight: 80
---

**Alert:** `OTelAuditLogsMissing`

## Problem

An audit collector pod has not exported a single record in 60 minutes. Fires per node/pod. Scope is a single collector instance.

Possible causes:
- Pod in `CrashLoopBackoff` (common: auditd init container failed to stop host auditd).
- Config references missing secret/configmap.
- No audit sources on the node (unlikely — kube-apiserver audit is cluster-wide).
- Exporter queue stuck (see [`OTelAuditLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexporterqueuefilling.md" >}})).

## Impact

**PCI-DSS: compliance incident.** Audit coverage on affected nodes is lost until restored. Backfill may be needed depending on retention and policy.

## Diagnosis

1. Note `k8s_node_name` and `pod` from alert.
1. Find the pod from the alert's `pod` label (or by node):
   ```sh
   POD=<pod-from-alert>
   # or by node:
   POD=$(kubectl get pods -n fortlogs-audit -l app.kubernetes.io/instance=fortlogs-audit.audit-logs -o jsonpath='{.items[0].metadata.name}')
   ```
1. Check pod state:
   ```sh
   kubectl get pod "$POD" -n fortlogs-audit -o wide
   kubectl describe pod "$POD" -n fortlogs-audit | tail -40
   ```
1. Pay special attention to init container status — if the auditd init container failed, the main container stays `Pending`.
1. Tail logs (current and previous):
   ```sh
   kubectl logs "$POD" -n fortlogs-audit -c otc-container --tail=200
   kubectl logs "$POD" -n fortlogs-audit -c otc-container --previous --tail=200
   ```
1. For auditd: verify host auditd is stopped:
   ```sh
   kubectl debug node/<node> -it --image=busybox -- chroot /host systemctl status auditd
   ```
1. Check [`OTelAuditLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexporterqueuefilling.md" >}}) on the same node.

## Resolution Steps

1. If pod crashlooping: resolve the cause (secret, config, resources, host auditd conflict).
1. If host auditd running: the init container `_auditd-config.tpl` stop logic failed. Investigate why `systemctl stop auditd` didn't work; manually stop if needed, then recreate the pod.
1. If queue stuck: follow [`OTelAuditLogsExporterQueueFilling`]({{< relref "/docs/operations/playbooks/audit-logs/otelauditlogsexporterqueuefilling.md" >}}) first.
1. If no obvious cause, delete the pod — operator recreates it:
   ```sh
   kubectl delete pod "$POD" -n fortlogs-audit
   ```
1. Verify export resumes.
1. **Report the gap window to the compliance/security team.**
