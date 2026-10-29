---
title: "Kube audit policy logs credential bodies"
description: "Alert: KubeAuditCredentialBodyRemoved"
weight: 110
---

**Alert:** `KubeAuditCredentialBodyRemoved`

## Problem

The audit-logs collector's `transform/kube_audit` processor removed credential-bearing bodies from kube-apiserver audit events. **The scrubber worked**, but the alert tells you the cluster's audit policy is misconfigured: it's logging Secrets, Tokens, or kubeconfig bodies at `RequestResponse` or `Request` level.

## Impact

Without the scrubber, **plaintext credentials would be stored in the audit index**. This is a severe security exposure. The alert indicates:
- Current state: safe (bodies scrubbed before export).
- Underlying state: audit policy must be fixed; relying on the scrubber as the only line of defense is wrong.

## Diagnosis

1. Note `k8s_cluster_name` from alert.
1. Query OpenSearch on the audit index for `sap.cc.audit.credential_body_removed: true` on the affected cluster for the last 30 minutes.
1. Group hits by `objectRef.resource` and `verb` to identify which policy rules are the problem.
   Common culprits:
   - `secrets` + `get`/`list` at `RequestResponse` level (should be `Metadata`).
   - `serviceaccounts/token` + `create` at `Request`/`RequestResponse` (should be `Metadata`).
   - `configmaps` at `RequestResponse` where kubeconfig blobs may live.

## Resolution Steps

1. Fix the cluster's kube-apiserver audit policy. For sensitive resources, use `Metadata` level only — never `Request` or `RequestResponse`.
1. Roll the control plane (API server pods) so the new policy loads.
1. Verify no new `credential_body_removed=true` events in OpenSearch after rollout.
1. The alert will stop firing once no scrubbing occurs within the 30-minute window.
1. Keep the collector-side scrubber in place as a defence-in-depth measure.
