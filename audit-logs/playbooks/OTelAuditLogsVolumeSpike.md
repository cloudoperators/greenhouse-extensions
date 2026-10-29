---
title: "Audit log volume spike detected"
description: "Alert: OTelAuditLogsVolumeSpike"
weight: 70
---

**Alert:** `OTelAuditLogsVolumeSpike`

## Problem

An audit cluster is receiving records at 5x the 1-hour baseline (sustained 5min). Receiver-side metric: counts raw ingest before filtering.

Common causes:
- Kube-apiserver audit policy was broadened (more resources/verbs at `RequestResponse` level).
- A workload triggered a privilege-escalation pattern caught by `auditd` PCI-DSS rules.
- IAS poller fetching a backlog after a connectivity outage.
- Legitimate security incident (active intrusion, mass secret access).

**Treat with suspicion:** a sudden spike in audit volume can indicate a security event in progress.

## Impact

Receiver load increases; queue pressure may follow. More importantly, the spike may be a security signal worth triaging immediately.

## Diagnosis

1. Identify affected cluster.
1. Query top sources at the receiver:
   ```promql
   topk(10, sum by (receiver) (rate(otelcol_receiver_accepted_log_records{job=~".*/audit-collector-logs"}[5m])))
   ```
1. If kube-apiserver audit is driving: query OpenSearch for the top `resource`/`verb` combinations in the last 10 minutes vs. prior hour.
1. If auditd is driving: query OpenSearch for the top `key` (audit rule key) values.
1. **Correlate with security context**: look for root escalations, mass secret reads, unusual service accounts.

## Resolution Steps

1. If security-relevant: escalate to the security/compliance team **before** throttling. Audit integrity > performance.
1. If kube-apiserver audit policy was intentionally broadened: notify sink owner of the new volume.
1. If auditd rule firing excessively on legitimate activity: tune the rule in `_auditd-config.tpl` only after security review.
1. If IAS poller backlog: wait for drain; monitor queue pressure.
1. Verify volume returns within 5x of baseline.
