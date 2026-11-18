---
title: "Falco: Syslog TLS secret modified"
description: "Alert: FalcoOTelSyslogTLSWrite"
weight: 103
---

**Alert:** `FalcoOTelSyslogTLSWrite`

## Problem

Falco rule `OpenTelemetry Syslog TLS Write` fired: a write or delete on `/etc/ssl/syslog-tls` inside the external collector. The private key never rotates from inside the pod.

## Impact

Syslog TLS key may be replaced or copied; outbound syslog traffic can be intercepted or impersonated.

## Diagnosis

1. From the Falco event, note `k8s.pod.name`, `proc.name`, `proc.cmdline`, `user.name`.
1. Verify Secret matches Git source of truth.
1. Check for anomalous outbound syslog connections.

## Resolution Steps

1. Rotate the syslog TLS keypair.
1. Delete the collector pod to re-project the Secret.
1. Treat as credential compromise: trigger key-rotation playbook for the downstream syslog receiver.
