---
title: KubeAuditCredentialBodyRemoved
weight: 20
---

# KubeAuditCredentialBodyRemoved

## Problem

The audit-logs collector removed credential-bearing request/response bodies from kube-apiserver audit events. The cluster's audit policy logs Secrets, tokens, or kubeconfig bodies at `RequestResponse`/`Request` level.

## Impact

Without the collector's scrubber the index would store plaintext credentials. The alert indicates an audit policy misconfiguration that must be corrected at the source.

## Diagnosis

1. Find the offending events: query the audit index for `sap.cc.audit.credential_body_removed: true` on the affected cluster.
1. The event resource/verb identifies the policy rule to tighten.

## Resolution Steps

1. Fix the cluster's kube-apiserver audit policy to log Secret/token/kubeconfig access at `Metadata` level only.
1. Roll the control plane and verify the alert clears.
