---
title: "Falco: OpenSearch CA volume modified"
description: "Alert: FalcoOTelOpenSearchCAWrite"
weight: 101
---

**Alert:** `FalcoOTelOpenSearchCAWrite`

## Problem

Falco rule `OpenTelemetry OpenSearch CA Write` fired: a write or delete occurred on `/etc/ssl/opensearch` inside a logs or audit-logs collector pod. The volume is a projected Secret and is read-only by design.

## Impact

Trust store for the OpenSearch exporter has been altered; TLS verification may be bypassed or export may break.

## Diagnosis

1. Pull the Falco event, note `k8s.pod.name`, `k8s.ns.name`, `proc.name`, `proc.cmdline`, `container.name`.
1. Confirm the secret is unchanged upstream:
   ```sh
   kubectl -n <ns> get secret <opensearch-ca-secret> -o yaml | sha256sum
   ```
1. Diff the in-pod file vs. the Secret:
   ```sh
   kubectl -n <ns> exec <pod> -c <container> -- sha256sum /etc/ssl/opensearch/*
   ```

## Resolution Steps

1. Delete the pod to re-project the Secret (readOnly volume).
1. If the Secret itself was mutated out-of-band, restore from Git / sealed secret.
1. Investigate who/what triggered the write (process + loginuid from the Falco event).
