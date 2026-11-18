---
title: "Falco: Kafka CA volume modified"
description: "Alert: FalcoOTelKafkaCAWrite"
weight: 102
---

**Alert:** `FalcoOTelKafkaCAWrite`

## Problem

Falco rule `OpenTelemetry Kafka CA Write` fired: a write or delete on `/etc/ssl/kafka` or `/etc/ssl/audit-kafka` inside a collector pod. These projected Secrets must stay read-only.

## Impact

Kafka trust store altered; the collector may fail to authenticate brokers or trust a forged broker.

## Diagnosis

1. From the Falco event capture `k8s.pod.name`, `k8s.ns.name`, `proc.*`, `fd.name`.
1. Verify upstream Secret matches expected content.
1. Check for broker auth failures:
   ```sh
   kubectl -n <ns> logs <pod> -c otc-container --tail=200 | grep -i -E "kafka|sasl|tls"
   ```

## Resolution Steps

1. Delete the pod to re-project the Secret.
1. If Secret itself changed, restore from Git.
1. Investigate the originating process; treat as tampering until proven otherwise.
