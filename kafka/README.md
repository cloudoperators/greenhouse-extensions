---
title: Kafka
---

## Kafka Plugin

The **Kafka** plugin sets up an Apache Kafka environment using the **Strimzi Kafka Operator**, automating deployment, provisioning, management, and orchestration of Kafka clusters with KRaft mode (without ZooKeeper).

## Overview

Apache Kafka is a distributed event streaming platform designed for high-throughput, fault-tolerant, real-time data processing.
The **Strimzi Kafka Operator** simplifies the management of Kafka clusters on Kubernetes.

### Components included in this Plugin:

- [Strimzi Kafka Operator](https://github.com/strimzi/strimzi-kafka-operator)
- Apache Kafka Cluster Management (KRaft mode)
- Kafka Connect (optional)
- Kafka Bridge (optional)
- Kafka Exporter for Metrics (optional)
- Cruise Control for Cluster Optimization (optional)
- Entity Operator for Topic and User Management

## Note

More configurations will be added over time, and contributions of custom configurations are highly appreciated.
If you discover bugs or want to add functionality to the plugin, feel free to create a pull request.

## Quick Start

### Prerequisites

- A running and Greenhouse-onboarded Kubernetes cluster.
- Sufficient cluster resources for running Kafka (minimum 3 nodes recommended for production).
- Prometheus Operator installed if you want to enable monitoring (recommended).

### Installation

1. Navigate to the **Greenhouse Dashboard**.
2. Select the **Kafka** plugin from the catalog.
3. Specify the target cluster and configuration options.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| commonLabels | object | `{}` | common labels to apply to all resources. |
| cruiseControl.enabled | bool | `false` | Enable Cruise Control |
| cruiseControl.resources.limits.cpu | string | `"1000m"` |  |
| cruiseControl.resources.limits.memory | string | `"1Gi"` |  |
| cruiseControl.resources.requests.cpu | string | `"500m"` |  |
| cruiseControl.resources.requests.memory | string | `"512Mi"` |  |
| entityOperator.enabled | bool | `true` | Enable Entity Operator |
| entityOperator.topicOperator.resources.limits.cpu | string | `"200m"` |  |
| entityOperator.topicOperator.resources.limits.memory | string | `"256Mi"` |  |
| entityOperator.topicOperator.resources.requests.cpu | string | `"100m"` |  |
| entityOperator.topicOperator.resources.requests.memory | string | `"128Mi"` |  |
| entityOperator.userOperator.resources.limits.cpu | string | `"200m"` |  |
| entityOperator.userOperator.resources.limits.memory | string | `"256Mi"` |  |
| entityOperator.userOperator.resources.requests.cpu | string | `"100m"` |  |
| entityOperator.userOperator.resources.requests.memory | string | `"128Mi"` |  |
| kafka.config | object | `{"auto.create.topics.enable":false,"default.replication.factor":3,"log.retention.check.interval.ms":300000,"log.retention.hours":168,"log.segment.bytes":1073741824,"min.insync.replicas":2,"offsets.topic.replication.factor":3,"transaction.state.log.min.isr":2,"transaction.state.log.replication.factor":3}` | Kafka broker configuration |
| kafka.enabled | bool | `true` | Enable or disable Kafka cluster deployment |
| kafka.jvmOptions | object | `{"xms":"1024m","xmx":"2048m"}` | JVM options for Kafka brokers |
| kafka.listeners | list | `[{"name":"plain","port":9092,"tls":false,"type":"internal"},{"name":"tls","port":9093,"tls":true,"type":"internal"}]` | Listener configuration |
| kafka.metricsEnabled | bool | `true` | Enable metrics |
| kafka.name | string | `"kafka-cluster"` | Name of the Kafka cluster |
| kafka.replicas | int | `3` | Number of Kafka broker/controller replicas (for KRaft mode) |
| kafka.resources | object | `{"limits":{"cpu":"2000m","memory":"4Gi"},"requests":{"cpu":"1000m","memory":"2Gi"}}` | Resource configuration for Kafka brokers |
| kafka.storage | object | `{"type":"jbod","volumes":[{"class":"","deleteClaim":false,"id":0,"size":"100Gi","type":"persistent-claim"}]}` | Storage configuration for Kafka brokers |
| kafka.version | string | `"3.9.0"` | Kafka version |
| kafkaExporter.enabled | bool | `false` | Enable Kafka Exporter |
| kafkaExporter.groupRegex | string | `".*"` |  |
| kafkaExporter.resources.limits.cpu | string | `"200m"` |  |
| kafkaExporter.resources.limits.memory | string | `"256Mi"` |  |
| kafkaExporter.resources.requests.cpu | string | `"100m"` |  |
| kafkaExporter.resources.requests.memory | string | `"128Mi"` |  |
| kafkaExporter.topicRegex | string | `".*"` |  |
| monitoring.additionalRuleLabels | object | `{}` | Additional labels for PrometheusRule alerts |
| monitoring.enabled | bool | `true` | Enable Prometheus monitoring |
| operator.enabled | bool | `true` | Enable or disable the Strimzi Kafka Operator installation |
| testFramework.enabled | bool | `true` | Activates the Helm chart testing framework. |
| testFramework.image.pullPolicy | string | `"Always"` | Defines the image pull policy for the test framework. |
| testFramework.image.registry | string | `"ghcr.io"` | Defines the image registry for the test framework. |
| testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` | Defines the image repository for the test framework. |
| testFramework.image.tag | string | `"main"` | Defines the image tag for the test framework. |
| topics.audit.cleanupPolicy | string | `"delete"` | Cleanup policy |
| topics.audit.compressionType | string | `"producer"` | Compression type |
| topics.audit.enabled | bool | `true` | Enable this topic |
| topics.audit.maxMessageBytes | int | `1048576` | Max message size (1 MB) |
| topics.audit.minInsyncReplicas | int | `2` | Min in-sync replicas |
| topics.audit.partitions | int | `3` | Number of partitions (should match OpenSearch index shards) |
| topics.audit.replicas | int | `3` | Replication factor |
| topics.audit.retention | int | `86400000` | Retention period (24 hours = 86400000 ms) |
| topics.audit.segmentBytes | int | `1073741824` | Segment size (1 GB) |
| topics.logs.cleanupPolicy | string | `"delete"` | Cleanup policy |
| topics.logs.compressionType | string | `"producer"` | Compression type |
| topics.logs.enabled | bool | `true` | Enable this topic |
| topics.logs.maxMessageBytes | int | `1048576` | Max message size (1 MB) |
| topics.logs.minInsyncReplicas | int | `2` | Min in-sync replicas |
| topics.logs.partitions | int | `3` | Number of partitions (should match OpenSearch index shards) |
| topics.logs.replicas | int | `3` | Replication factor |
| topics.logs.retention | int | `86400000` | Retention period (24 hours = 86400000 ms) |
| topics.logs.segmentBytes | int | `1073741824` | Segment size (1 GB) |
