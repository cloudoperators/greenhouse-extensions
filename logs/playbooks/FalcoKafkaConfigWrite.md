---
title: "Falco: Kafka config modified at runtime"
description: "Alert: FalcoKafkaConfigWrite"
weight: 102
---

**Alert:** `FalcoKafkaConfigWrite`

## Problem

Falco rule `Kafka Config Write` fired: a non-trusted process wrote to `/opt/kafka/config`, `/opt/kafka/custom-config`, or `/tmp/strimzi.properties` inside a broker pod.

## Impact

Broker ACLs, listeners, or auth config may have been altered (PCI-DSS 10.3.2).

## Diagnosis

1. From the Falco event note `fd.name`, `proc.*`, `user.*`.
1. Verify the Strimzi KafkaCluster CR matches Git.
1. Diff in-pod file hashes against the rendered config.

## Resolution Steps

1. Delete the broker pod; Strimzi re-renders config.
1. If the CR itself was mutated, restore from Git.
1. Open a security incident.
