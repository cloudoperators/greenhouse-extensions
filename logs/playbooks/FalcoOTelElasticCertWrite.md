---
title: "Falco: Elastic client certs modified"
description: "Alert: FalcoOTelElasticCertWrite"
weight: 104
---

**Alert:** `FalcoOTelElasticCertWrite`

## Problem

Falco rule `OpenTelemetry Elastic Cert Write` fired: a write or delete on `/etc/otel/certs` inside an audit-logs collector pod. The volume is a projected Secret used by the elastic exporter.

## Impact

Exfiltration-path client certs altered; audit events may be sent to the wrong destination or export may fail.

## Diagnosis

1. From the Falco event, note `k8s.pod.name`, `proc.*`, `fd.name`.
1. Confirm Secret is unchanged upstream.
1. Diff in-pod file hashes against the Secret content.

## Resolution Steps

1. Delete the pod to re-project the Secret.
1. Rotate the elastic client cert if tampering is suspected.
1. Investigate originating process.
