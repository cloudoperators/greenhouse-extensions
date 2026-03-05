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
| cruiseControl.resources | object | requests: 512Mi memory, 500m CPU; limits: 1Gi memory, 1 CPU | Cruise Control resource configuration |
| entityOperator.enabled | bool | `true` | Enable Entity Operator |
| entityOperator.topicOperator | object | requests: 128Mi memory, 100m CPU; limits: 256Mi memory, 200m CPU | Topic Operator resource configuration |
| entityOperator.userOperator | object | requests: 128Mi memory, 100m CPU; limits: 256Mi memory, 200m CPU | User Operator resource configuration |
| kafka.config | object | See values.yaml for production defaults | Kafka broker configuration |
| kafka.enabled | bool | `true` | Enable or disable Kafka cluster deployment |
| kafka.jvmOptions | object | xms: 1024m, xmx: 2048m | JVM heap settings for Kafka brokers. xms (initial heap) and xmx (max heap): Heap should be kept modest to preserve memory for OS page cache, which Kafka relies on heavily for performance. See: https://docs.confluent.io/platform/current/kafka/deployment.html |
| kafka.listeners | list | plaintext on 9092, TLS on 9093 | Listener configuration |
| kafka.metricsEnabled | bool | `true` | Enable metrics |
| kafka.name | string | `"kafka"` | Name of the Kafka cluster |
| kafka.replicas | int | `3` | Number of Kafka broker/controller replicas (for KRaft mode) |
| kafka.resources | object | requests: 2Gi memory, 1 CPU; limits: 4Gi memory, 2 CPU | Resource configuration for Kafka brokers |
| kafka.storage | object | JBOD with 100Gi persistent volume per broker | Storage configuration for Kafka brokers |
| kafka.version | string | `"4.1.0"` | Kafka version |
| kafkaExporter.enabled | bool | `false` | Enable Kafka Exporter |
| kafkaExporter.groupRegex | string | `".*"` | Consumer group regex for metrics export |
| kafkaExporter.resources | object | requests: 128Mi memory, 100m CPU; limits: 256Mi memory, 200m CPU | Kafka Exporter resource configuration |
| kafkaExporter.topicRegex | string | `".*"` | Topic regex for metrics export |
| monitoring.additionalRuleLabels | object | `{}` | Additional labels for PrometheusRule alerts |
| monitoring.enabled | bool | `true` | Enable Prometheus monitoring |
| monitoring.podMonitor | object | `{"labels":{}}` | Pod Monitor configuration |
| monitoring.podMonitor.labels | object | `{}` | Labels to add to the PodMonitor so Prometheus can discover it. |
| operator.enabled | bool | `true` | Enable or disable the Strimzi Kafka Operator installation |
| testFramework.enabled | bool | `true` | Activates the Helm chart testing framework. |
| testFramework.image | object | ghcr.io/cloudoperators/greenhouse-extensions-integration-test:main | Test framework image configuration |
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
