---
title: KafkaNoBrokersOnline
weight: 20
---

# KafkaNoBrokersOnline

## Problem

The `kafka_server_kafkaserver_brokerstate` metric is entirely absent, meaning no Kafka broker is reporting metrics. The cluster is almost certainly down or unreachable from Prometheus.

## Impact

- Total outage: no producers can write and no consumers can read.
- Downstream pipelines (e.g. OpenSearch ingestion) stop receiving data, and unconsumed messages may be lost once retention expires.

## Diagnosis

1. Check the broker pods:

   ```
   kubectl get pods -n <kafka-namespace> -l strimzi.io/component-type=kafka -o wide
   ```

   - No pods → the Kafka cluster is not deployed or the pods are failing to schedule (check the `Kafka`/`KafkaNodePool` resources, the Strimzi operator, and node capacity). Less likely, the resource or namespace was removed.
   - Pods present but not `Running` → the brokers are failing to start.
   - Pods `Running` and healthy → the problem is metrics scraping, not Kafka itself.

2. For failing brokers, inspect logs and events for the root cause (storage unavailable, config error, node or KRaft quorum problem):

   ```
   kubectl logs <kafka-broker-pod> -n <kafka-namespace> --tail=200
   kubectl describe pod <kafka-broker-pod> -n <kafka-namespace>
   ```

3. Check for infrastructure outages affecting all brokers at once (node pool down, storage backend unavailable).

## Solution

- **Brokers failing to start:** fix the underlying issue (restore storage, correct config) and let Strimzi bring the brokers back.
- **Infrastructure outage:** resolve the node/storage problem; brokers recover once nodes and volumes return.
- **Metrics-only problem:** if brokers are healthy, restart the affected pod or reconcile the PodMonitor so Prometheus resumes scraping.
- **Expected downtime:** mute the alert and notify the service owner.

Confirm broker pods are `Running` and the metric reappears in Prometheus.
