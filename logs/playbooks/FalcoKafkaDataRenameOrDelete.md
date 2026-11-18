---
title: "Falco: Kafka data file modified"
description: "Alert: FalcoKafkaDataRenameOrDelete"
weight: 101
---

**Alert:** `FalcoKafkaDataRenameOrDelete`

## Problem

Falco rule `Kafka Data Rename Or Delete` fired: a non-broker process renamed or deleted a file under a Kafka data volume. Normal segment rollover is broker-driven.

## Impact

Message history destroyed; consumers downstream will see gaps or offsets reset.

## Diagnosis

1. From the Falco event note `k8s.pod.name`, `evt.type`, `fd.name`, `proc.*`.
1. Check replication health:
   ```sh
   kubectl -n <namespace> exec <broker-pod> -c kafka -- /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --under-replicated-partitions
   ```

## Resolution Steps

1. Delete the broker pod; re-sync from ISR.
1. If ISR is empty for the partition, unclean leader election may be required (data loss) — escalate.
1. Open a security incident.
