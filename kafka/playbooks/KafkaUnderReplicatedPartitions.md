---
title: KafkaUnderReplicatedPartitions
weight: 20
---

# KafkaUnderReplicatedPartitions

## Problem

One or more topic partitions have had fewer in-sync replicas (ISR) than configured for more than 15 minutes. A follower replica is not keeping up with, or has lost contact with, the leader.

## Impact

- Reduced fault tolerance: if the leader for an under-replicated partition fails, data loss or unavailability may occur.
- Producers using `acks=all` may start failing writes if ISR drops below `min.insync.replicas`.

## Diagnosis

1. Check the broker pods. A brief window of under-replication during a rolling restart or rebalance is normal and self-heals; a persistent 15-minute alert means a broker is genuinely unhealthy:

   ```
   kubectl get pods -n <kafka-namespace> -l strimzi.io/component-type=kafka -o wide
   ```

2. Inspect the affected broker's logs and disk. A crashing broker or a full/slow disk is the usual cause of a follower falling out of ISR:

   ```
   kubectl logs <kafka-broker-pod> -n <kafka-namespace> --tail=200
   kubectl exec <kafka-broker-pod> -n <kafka-namespace> -- df -h /var/lib/kafka
   ```

3. Check for node-level problems (node under pressure, drained, or network partition).

## Solution

- **Unhealthy broker:** let Strimzi recover it; delete a stuck pod so the operator recreates it, and confirm it rejoins and ISR is restored.
- **Disk full:** free space or expand the broker's volume; review topic retention if disks fill repeatedly.
- **Node problem:** cordon/drain the bad node and let the pod reschedule (anti-affinity keeps brokers spread across nodes).

Confirm `kafka_topic_partition_under_replicated_partition` returns to 0 for the affected topic.
