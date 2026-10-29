---
title: KubeAuditCredentialBodyRemoved
weight: 20
---

# KubeAuditCredentialBodyRemoved

## Problem

Audit-logs collector removed credential-bearing request/response bodies from kube-apiserver audit events. Cluster's audit policy logs Secrets, tokens, or kubeconfig bodies at `RequestResponse`/`Request` level.

## Impact

Without collector scrubber, plaintext credentials would be stored in audit index. Alert indicates audit policy misconfiguration that must be fixed at the source.

## Diagnosis

1. Query audit index: `sap.cc.audit.credential_body_removed: true` on affected cluster.
1. Note resource/verb to identify which audit policy rule logs credentials.

## Resolution Steps

1. Fix kube-apiserver audit policy to log Secret/token/kubeconfig at `Metadata` level only (not body).
1. Roll the control plane.
1. Verify alert clears.
