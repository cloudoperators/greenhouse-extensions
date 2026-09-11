---
title: KafkaConsumerLagTooHigh
weight: 20
---

# KafkaConsumerLagTooHigh

## Problem

A consumer group's lag on a topic has exceeded 1000 messages for more than 15 minutes. Consumers are falling behind the producers.

## Impact

- Data reaches downstream systems (e.g. OpenSearch) later than expected.
- If lag keeps growing, messages may be dropped once they exceed the topic retention before being consumed.

## Diagnosis

1. Identify the affected `consumergroup` and `topic` from the alert labels. In fortlogs deployments the consumers are the ingesters.

2. Check the consumer pods and their logs for crashes, restarts, or errors (bad credentials, unreachable backend, downstream rejects):

   ```
   kubectl get pods -n <ingester-namespace> | grep -i ingester
   kubectl logs <ingester-pod> -n <ingester-namespace> --tail=200
   ```

3. Decide whether a consumer is stalled/failing, whether it simply can't keep up with sustained load, or whether producer volume spiked (e.g. a log storm).

## Solution

- **Stalled or failing consumer:** fix the root cause from the logs and restart the pod; confirm it rejoins the group and lag drains.
- **Can't keep up with load:** increase consuming capacity. Scale up the ingester pods (parallelism is capped at the topic's partition count) and/or increase `num_sender` so each pod pushes more batches concurrently. If already at the partition count, raise the topic partitions and downstream backend capacity.
- **Expected spike:** if the lag is a known, temporary spike that is already draining, mute the alert and notify the service owner.

Confirm lag returns below the threshold and stays there.
