---
title: "Falco: Kafka data dir written"
description: "Alert: FalcoKafkaDataWrite"
weight: 100
---

**Alert:** `FalcoKafkaDataWrite`

## Problem

Falco rule `Kafka Data Write` fired: a non-broker process wrote to a Kafka JBOD data volume (`/var/lib/kafka/data-*`).

## Impact

Message log tampered or injected; segment integrity compromised.

## Diagnosis

1. From the Falco event note `k8s.pod.name`, `k8s.ns.name`, `proc.*`, `fd.name`, `user.*`.
1. Check broker state and under-replicated partitions:
   ```sh
   kubectl -n <namespace> get kafka
   kubectl -n <namespace> exec <broker-pod> -c kafka -- /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --under-replicated-partitions
   ```

## Resolution Steps

1. Terminate unauthorized sessions.
1. Delete the affected broker pod; Strimzi reassigns partitions from ISR.
1. Open a security incident.
