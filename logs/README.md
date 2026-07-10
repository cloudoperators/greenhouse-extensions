---
title: Logs Plugin
---

Learn more about the **Logs** Plugin. Use it to enable the ingestion, collection and export of telemetry signals (logs and metrics) for your Greenhouse cluster.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

OpenTelemetry is an observability framework and toolkit for creating and managing telemetry data such as metrics, logs and traces. Unlike other observability tools, OpenTelemetry is vendor and tool agnostic, meaning it can be used with a variety of observability backends, including open source tools such as _OpenSearch_ and _Prometheus_.

The focus of the Plugin is to provide easy-to-use configurations for common use cases of receiving, processing and exporting telemetry data in Kubernetes. The storage and visualization of the same is intentionally left to other tools.

Components included in this Plugin:

- [Operator](https://opentelemetry.io/docs/kubernetes/operator/)
- [Collector](https://github.com/open-telemetry/opentelemetry-collector)
  - [Receivers](https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/README.md)
      - [Filelog](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/filelogreceiver)
      - [k8sevents](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/k8seventsreceiver)
      - [journald](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/journaldreceiver)
      - [Syslog](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/receiver/syslogreceiver/README.md)
      - [Prometheus](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/prometheusreceiver)
  - [Connectors](https://opentelemetry.io/docs/collector/building/connector/)
      - [Routing](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/connector/routingconnector/README.md)
      - [Failover](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/failoverconnector)
  - [Exporters](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter)
      - [OpenSearch](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/opensearchexporter)
      - [Kafka](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/kafkaexporter)
      - [Prometheus](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/prometheusexporter)

## Architecture

![OpenTelemetry Architecture](img/otel-arch.png)

## Note

It is the intention to add more configuration over time and contributions of your very own configuration is highly appreciated. If you discover bugs or want to add functionality to the Plugin, feel free to create a pull request.

## Quick Start

This guide provides a quick and straightforward way to use **OpenTelemetry** for Logs as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.
- For logs, a OpenSearch instance to store. If you don't have one, reach out to your observability team to get access to one.
- We recommend a running cert-manager in the cluster before installing the **Logs** Plugin
- To gather metrics, you **must** have a Prometheus instance in the onboarded cluster for storage and for managing Prometheus specific CRDs. If you don not have an instance, install the [kube-monitoring](https://cloudoperators.github.io/greenhouse/docs/reference/catalog/kube-monitoring) Plugin first.

**Step 1:**

You can install the `Logs` package in your cluster by installing it with [Helm](https://helm.sh/docs/helm/helm_install) manually or let the Greenhouse platform lifecycle do it for you automatically. For the latter, you can either:
  1. Go to Greenhouse dashboard and select the **Logs** Plugin from the catalog. Specify the cluster and required option values.
  2. Create and specify a `Plugin` resource in your Greenhouse central cluster according to the [examples](#examples).

**Step 2:**

You can choose if you want to deploy the OpenTelemetry Operator including the collectors or set `opentelemetry-operator.enabled` to `false` in case you already have an existing Operator deployed in your cluster. The OpenTelemetry Operator works as a manager for the collectors and auto-instrumentation of the workload.
By default, the package will include a configuration for collecting metrics and logs. The log-collector is currently processing data from the [preconfigured receivers](#Overview):
- Files via the Filelog Receiver
- Kubernetes Events from the Kubernetes API server
- Journald events from systemd journal
- Syslogs received over TCP or UDP
- its own metrics

You can disable the collection of logs by setting `openTelemetry.logCollector.enabled` to `false`. The same is true for disabling the collection of metrics by setting `openTelemetry.metricsCollector.enabled` to `false`.
The `logsCollector` comes with a standard set of log-processing, such as adding cluster information and common labels for Journald events.
In addition we provide default pipelines for common log types. Currently the following log types have default configurations that can be enabled (requires `logsCollector.enabled` to `true`):
  1. KVM: `openTelemetry.logsCollector.kvmConfig`: Logs from Kernel-based Virtual Machines (KVMs) providing insights into virtualization activities, resource usage, and system performance
  2. Ceph:`openTelemetry.logsCollector.cephConfig`: Logs from Ceph storage systems, capturing information about cluster operations, performance metrics, and health status
  3. OpenStack: `openTelemetry.logCollector.openstackConfig`: Specific Parsing for [OpenStack](https://www.openstack.org/) services for example Neutron or Keystone
  4. External: `openTelemetry.logCollector.externalConfig`: Enables a Load Balancer that accepts Syslog via UDP and TCP from external systems.

These default configurations provide common labels and Grok parsing for logs emitted through the respective services.

Based on the backend selection the telemetry data will be exporter to the backend.

**Step 3:**

Greenhouse regularly performs integration tests that are bundled with the **Logs** Plugin. These provide feedback on whether all the necessary resources are installed and continuously up and running. You will find messages about this in the Plugin status and also in the Greenhouse dashboard.

## Failover Connector

The **Logs** Plugin comes with a [Failover Connector](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/failoverconnector) for OpenSearch for two users. The connector will periodically try to establish a stable connection for the prefered user (`failover_username_a`) and in case of a failed try, the connector will try to establish a connection with the fallback user (`failover_username_b`). This feature can be used to secure the shipping of logs in case of expiring credentials or password rotation.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| commonLabels | object | `{}` | common labels to apply to all resources. |
| customCRDs.enabled | bool | `true` | The required CRDs used by this dependency are version-controlled in this repository under ./charts/crds. |
| extraManifests | list | `[]` | Extra Kubernetes manifests to include in the Helm release. Each entry is rendered as-is (map) or with `tpl` (string). Useful for ConfigMaps that satisfy cluster admission policies. |
| openTelemetry.cluster | string | `nil` | Cluster label for Logging |
| openTelemetry.collectorImage | object | `{"repository":"ghcr.io/cloudoperators/opentelemetry-collector-contrib","tag":"a8981ba"}` | OpenTelemetry Collector image configuration |
| openTelemetry.collectorImage.repository | string | `"ghcr.io/cloudoperators/opentelemetry-collector-contrib"` | Image repository for OpenTelemetry Collector |
| openTelemetry.collectorImage.tag | string | `"a8981ba"` | Image tag for OpenTelemetry Collector |
| openTelemetry.customLabels | object | `{}` | custom Labels applied to servicemonitor, secrets and collectors |
| openTelemetry.externalCollector | object | `{"calicoLoadBalancerIP":false,"enabled":false,"externalConfig":{"alertmanager_port":1515,"deployments_port":1516,"enabled":false},"externalIP":null,"externalTrafficPolicy":"Local","kafkaTopic":"","kafkaTracesTopic":"","replicas":2,"serviceAnnotations":{},"serviceType":"LoadBalancer","syslogConfig":{"auditKafkaTopic":"","enabled":false,"nonAuditKafkaTopic":"","openSearchLogs":{"auditEndpoint":"","audit_failover_password_a":"","audit_failover_password_b":"","audit_failover_username_a":"","audit_failover_username_b":"","nonAuditEndpoint":""},"tcp_port":514,"udp_port":514},"syslogTLSConfig":{"clientCAEnabled":false,"dnsName":null,"enabled":false,"issuerGroup":"cert-manager.io","issuerKind":"ClusterIssuer","issuerName":null,"tcp_port":6514},"tracesConfig":{"enabled":false,"otlp_grpc_port":4317,"otlp_http_port":4318}}` | Standalone external OTel Collector as StatefulSet. |
| openTelemetry.externalCollector.calicoLoadBalancerIP | bool | `false` | Enable Calico projectcalico.org/loadBalancerIPs annotation for the external IP |
| openTelemetry.externalCollector.enabled | bool | `false` | Enables the standalone external OTel Collector StatefulSet and its PodMonitor. |
| openTelemetry.externalCollector.externalConfig | object | `{"alertmanager_port":1515,"deployments_port":1516,"enabled":false}` | Activates the external alertmanager webhook and deployment event receivers. |
| openTelemetry.externalCollector.externalConfig.alertmanager_port | int | `1515` | Port for alertmanager webhook events |
| openTelemetry.externalCollector.externalConfig.deployments_port | int | `1516` | Port for deployment TCP log events |
| openTelemetry.externalCollector.externalIP | string | `nil` | External IP exposed on the service |
| openTelemetry.externalCollector.externalTrafficPolicy | string | `"Local"` | External traffic policy for the external collector service (Local preserves source IP) |
| openTelemetry.externalCollector.kafkaTopic | string | `""` | Kafka topic name for external logs — alerts, deployments, syslog (e.g., "logs-external") |
| openTelemetry.externalCollector.kafkaTracesTopic | string | `""` | Kafka topic name for traces (e.g., "traces") |
| openTelemetry.externalCollector.replicas | int | `2` | Number of replicas for the external collector StatefulSet |
| openTelemetry.externalCollector.serviceAnnotations | object | `{}` | Additional annotations on the external Service |
| openTelemetry.externalCollector.serviceType | string | `"LoadBalancer"` | Service type for the external collector service |
| openTelemetry.externalCollector.syslogConfig | object | `{"auditKafkaTopic":"","enabled":false,"nonAuditKafkaTopic":"","openSearchLogs":{"auditEndpoint":"","audit_failover_password_a":"","audit_failover_password_b":"","audit_failover_username_a":"","audit_failover_username_b":"","nonAuditEndpoint":""},"tcp_port":514,"udp_port":514}` | Activates syslog TCP/UDP ingestion (rfc5424/rfc3164). |
| openTelemetry.externalCollector.syslogConfig.auditKafkaTopic | string | `""` | Kafka topic for audit-relevant syslog logs (only used when kafka is enabled) |
| openTelemetry.externalCollector.syslogConfig.nonAuditKafkaTopic | string | `""` | Kafka topic for non-audit syslog logs (only used when kafka is enabled) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs | object | `{"auditEndpoint":"","audit_failover_password_a":"","audit_failover_password_b":"","audit_failover_username_a":"","audit_failover_username_b":"","nonAuditEndpoint":""}` | OpenSearch configuration for syslog logs |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint | string | `""` | OpenSearch endpoint for audit-relevant syslog logs |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_password_a | string | `""` | Password for primary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_password_b | string | `""` | Password for secondary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_username_a | string | `""` | Username for primary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_username_b | string | `""` | Username for secondary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.nonAuditEndpoint | string | `""` | OpenSearch endpoint for non-audit syslog logs |
| openTelemetry.externalCollector.syslogConfig.tcp_port | int | `514` | TCP port for syslog (rfc5424) |
| openTelemetry.externalCollector.syslogConfig.udp_port | int | `514` | UDP port for syslog (rfc3164) |
| openTelemetry.externalCollector.syslogTLSConfig | object | `{"clientCAEnabled":false,"dnsName":null,"enabled":false,"issuerGroup":"cert-manager.io","issuerKind":"ClusterIssuer","issuerName":null,"tcp_port":6514}` | Activates syslog TCP with TLS ingestion (rfc5424). |
| openTelemetry.externalCollector.syslogTLSConfig.clientCAEnabled | bool | `false` | Enable client CA verification (mTLS). Requires a ca.crt key in the TLS secret. |
| openTelemetry.externalCollector.syslogTLSConfig.dnsName | string | `nil` | DNS name for the TLS certificate |
| openTelemetry.externalCollector.syslogTLSConfig.issuerGroup | string | `"cert-manager.io"` | cert-manager issuer group (e.g. cert-manager.io or certmanager.cloud.sap) |
| openTelemetry.externalCollector.syslogTLSConfig.issuerKind | string | `"ClusterIssuer"` | cert-manager issuer kind (Issuer or ClusterIssuer) |
| openTelemetry.externalCollector.syslogTLSConfig.issuerName | string | `nil` | cert-manager Issuer or ClusterIssuer name for TLS certificate |
| openTelemetry.externalCollector.syslogTLSConfig.tcp_port | int | `6514` | TCP port for TLS syslog (rfc5424) |
| openTelemetry.externalCollector.tracesConfig | object | `{"enabled":false,"otlp_grpc_port":4317,"otlp_http_port":4318}` | Activates OTLP traces ingestion (gRPC and HTTP). |
| openTelemetry.externalCollector.tracesConfig.otlp_grpc_port | int | `4317` | gRPC port for OTLP traces |
| openTelemetry.externalCollector.tracesConfig.otlp_http_port | int | `4318` | HTTP port for OTLP traces |
| openTelemetry.ingesterCollector | object | see values.yaml | Kafka -> OpenSearch ingest collectors. One Deployment per entry. |
| openTelemetry.ingesterCollector.collectors | object | `{}` | Map of ingest collectors keyed by name. Configured via PluginPreset. |
| openTelemetry.ingesterCollector.enabled | bool | `false` | Enable the ingest collectors block. |
| openTelemetry.ingesterCollector.image.repository | string | `""` | Image repository override; falls back to openTelemetry.collectorImage.repository. |
| openTelemetry.ingesterCollector.image.tag | string | `""` | Image tag override; falls back to openTelemetry.collectorImage.tag. |
| openTelemetry.ingesterCollector.prometheus.podMonitor.enabled | bool | `true` | Render a PodMonitor per enabled ingest collector. |
| openTelemetry.ingesterCollector.replicas | int | `1` | Replica count per ingest collector Deployment. |
| openTelemetry.ingesterCollector.resources | object | `{}` | Pod resources per ingest collector Deployment. |
| openTelemetry.kafka | object | `{"brokers":[],"compression":"","enabled":false,"encoding":"","protocol_version":"","tls":{"enabled":false}}` | Kafka exporter configuration shared by all collectors |
| openTelemetry.kafka.brokers | list | `[]` | Kafka broker addresses (e.g., ["kafka-bootstrap.kafka.svc.cluster.local:9092"]) |
| openTelemetry.kafka.compression | string | `""` | Compression type (none, gzip, snappy, lz4, zstd) |
| openTelemetry.kafka.enabled | bool | `false` | Enable Kafka exporter (replaces OpenSearch failover with Kafka buffering) |
| openTelemetry.kafka.encoding | string | `""` | Message encoding format (otlp_json, otlp_proto, raw) |
| openTelemetry.kafka.protocol_version | string | `""` | Kafka protocol version (e.g., "3.9.0") |
| openTelemetry.kafka.tls | object | `{"enabled":false}` | TLS configuration for Kafka connections |
| openTelemetry.kafka.tls.enabled | bool | `false` | Enable TLS for Kafka connections |
| openTelemetry.logsCollector.batch | object | `{"sendBatchMaxSize":5000,"sendBatchSize":100,"timeout":"30s"}` | Batch processor settings for the logs collector. |
| openTelemetry.logsCollector.batch.sendBatchMaxSize | int | `5000` | Hard cap on records per batch. |
| openTelemetry.logsCollector.batch.sendBatchSize | int | `100` | Flush when this many records are buffered (raise for larger downstream batches). |
| openTelemetry.logsCollector.batch.timeout | string | `"30s"` | Flush after this duration regardless of size. |
| openTelemetry.logsCollector.cephConfig | object | `{"enabled":false}` | Activates the configuration for Ceph logs (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.containerdConfig | object | `{"enabled":true}` | Activates the containerd file log receiver (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.enabled | bool | `true` | Activates the standard configuration for Logs. |
| openTelemetry.logsCollector.journaldConfig | object | `{"enabled":true}` | Activates the journald receiver (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.k8seventsConfig | object | `{"enabled":true}` | Activates the k8s events receiver (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.kafkaStorageTopic | string | `""` | Kafka topic name for storage logs — swift, ceph (e.g., "logs-storage") |
| openTelemetry.logsCollector.kafkaTopic | string | `""` | Kafka topic name for general logs (e.g., "logs") |
| openTelemetry.logsCollector.kvmConfig | object | `{"enabled":false}` | Activates the configuration for KVM logs (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.openstackConfig | object | `{"enabled":false}` | Activates the configuration for OpenStack logs (requires logsCollector to be enabled). |
| openTelemetry.metricsCollector | object | `{"enabled":false}` | Activates the standard configuration for metrics. |
| openTelemetry.openSearchLogs.endpoint | string | `nil` | Endpoint URL for OpenSearch |
| openTelemetry.openSearchLogs.failover_password_a | string | `nil` | Password for OpenSearch endpoint |
| openTelemetry.openSearchLogs.failover_password_b | string | `nil` | Second Password (as a failover) for OpenSearch endpoint |
| openTelemetry.openSearchLogs.failover_username_a | string | `nil` | Username for OpenSearch endpoint |
| openTelemetry.openSearchLogs.failover_username_b | string | `nil` | Second Username (as a failover) for OpenSearch endpoint |
| openTelemetry.prometheus.additionalLabels | object | `{}` | Label selectors for the Prometheus resources to be picked up by prometheus-operator. |
| openTelemetry.prometheus.podMonitor | object | `{"enabled":true}` | Activates the pod-monitoring for the Logs Collector. |
| openTelemetry.prometheus.rules | object | `{"additionalRuleLabels":null,"annotations":{},"create":true,"enabled":["FilelogRefusedLogs","ReconcileErrors","ReceiverRefusedMetric","WorkqueueDepth","OTelLogsMissing","OTelLogsIncreasing","OTelLogsDecreasing","OTelLogsExportingFailed"],"labels":{}}` | Default rules for monitoring the opentelemetry components. |
| openTelemetry.prometheus.rules.additionalRuleLabels | string | `nil` | Additional labels for PrometheusRule alerts. |
| openTelemetry.prometheus.rules.annotations | object | `{}` | Annotations for PrometheusRules. |
| openTelemetry.prometheus.rules.create | bool | `true` | Enables PrometheusRule resources to be created. |
| openTelemetry.prometheus.rules.enabled | list | `["FilelogRefusedLogs","ReconcileErrors","ReceiverRefusedMetric","WorkqueueDepth","OTelLogsMissing","OTelLogsIncreasing","OTelLogsDecreasing","OTelLogsExportingFailed"]` | PrometheusRules to enable. |
| openTelemetry.prometheus.rules.labels | object | `{}` | Labels for PrometheusRules. |
| openTelemetry.prometheus.serviceMonitor | object | `{"enabled":true}` | Activates the service-monitoring for the Logs Collector. |
| openTelemetry.region | string | `nil` | Region label for Logging |
| opentelemetry-operator.admissionWebhooks.autoGenerateCert | object | `{"recreate":false}` | Activate to use Helm to create self-signed certificates. |
| opentelemetry-operator.admissionWebhooks.autoGenerateCert.recreate | bool | `false` | Activate to recreate the cert after a defined period (certPeriodDays default is 365). |
| opentelemetry-operator.admissionWebhooks.certManager | object | `{"enabled":false}` | Activate to use the CertManager for generating self-signed certificates. |
| opentelemetry-operator.admissionWebhooks.failurePolicy | string | `"Ignore"` | Defines if the admission webhooks should `Ignore` errors or `Fail` on errors when communicating with the API server. |
| opentelemetry-operator.crds.create | bool | `false` | If you want to use the upstream CRDs, set this variable to `true``. |
| opentelemetry-operator.enabled | bool | `true` | Set to true to enable the installation of the OpenTelemetry Operator. |
| opentelemetry-operator.manager.image.repository | string | `"ghcr.io/open-telemetry/opentelemetry-operator/opentelemetry-operator"` | overrides the default image repository for the OpenTelemetry Operator image. |
| opentelemetry-operator.manager.serviceMonitor.enabled | bool | `true` | Enable serviceMonitor for Prometheus metrics scrape |
| opentelemetry-operator.manager.serviceMonitor.extraLabels | object | `{}` | Additional labels on the ServiceMonitor |
| testFramework.enabled | bool | `true` | Activates the Helm chart testing framework. |
| testFramework.image.registry | string | `"ghcr.io"` | Defines the image registry for the test framework. |
| testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` | Defines the image repository for the test framework. |
| testFramework.image.tag | string | `"main"` | Defines the image tag for the test framework. |
| testFramework.imagePullPolicy | string | `"IfNotPresent"` | Defines the image pull policy for the test framework. |

### Examples

TBD
