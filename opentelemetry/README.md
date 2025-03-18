---
title: OpenTelemetry
---

Learn more about the **OpenTelemetry** Plugin. Use it to enable the ingestion, collection and export of telemetry signals (logs and metrics) for your Greenhouse cluster.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

OpenTelemetry is an observability framework and toolkit for creating and managing telemetry data such as metrics, logs and traces. Unlike other observability tools, OpenTelemetry is vendor and tool agnostic, meaning it can be used with a variety of observability backends, including open source tools such as _OpenSearch_ and _Prometheus_.

The focus of the Plugin is to provide easy-to-use configurations for common use cases of receiving, processing and exporting telemetry data in Kubernetes. The storage and visualization of the same is intentionally left to other tools.

Components included in this Plugin:

- [Operator](https://opentelemetry.io/docs/kubernetes/operator/)
- [Collector](https://github.com/open-telemetry/opentelemetry-collector)
- [Receivers](https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/README.md)
    - [Filelog Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/filelogreceiver)
    - [k8sevents Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/k8seventsreceiver)
    - [journald Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/journaldreceiver)
    - [prometheus/internal](https://opentelemetry.io/docs/collector/internal-telemetry/)
- [Connector](https://opentelemetry.io/docs/collector/building/connector/)
- [OpenSearch Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/opensearchexporter)

## Architecture

![OpenTelemetry Architecture](img/otel-arch.png)

## Note

It is the intention to add more configuration over time and contributions of your very own configuration is highly appreciated. If you discover bugs or want to add functionality to the plugin, feel free to create a pull request.

## Quick Start

This guide provides a quick and straightforward way to use **OpenTelemetry** as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.
- For logs, a OpenSearch instance to store. If you don't have one, reach out to your observability team to get access to one.
- We recommend a running cert-manager in the cluster before installing the OpenTelemetry Plugin
- To gather metrics, you **must** have a Prometheus instance in the onboarded cluster for storage and for managing Prometheus specific CRDs. If you don not have an instance, install the [kube-monitoring](https://cloudoperators.github.io/greenhouse/docs/reference/catalog/kube-monitoring) Plugin first.

**Step 1:**

You can install the `OpenTelemetry` package in your cluster by installing it with [Helm](https://helm.sh/docs/helm/helm_install) manually or let the Greenhouse platform lifecycle do it for you automatically. For the latter, you can either:
  1. Go to Greenhouse dashboard and select the **OpenTelemetry** Plugin from the catalog. Specify the cluster and required option values.
  2. Create and specify a `Plugin` resource in your Greenhouse central cluster according to the [examples](#examples).

**Step 2:**

The package will deploy the OpenTelemetry Operator which works as a manager for the collectors and auto-instrumentation of the workload. By default, the package will include a configuration for collecting metrics and logs. The log-collector is currently processing data from the [preconfigured receivers](#Overview):
- Files via the Filelog Receiver
- Kubernetes Events from the Kubernetes API server
- Journald events from systemd journal
- its own metrics

You can disable the collection of logs by setting `openTelemetry.logCollector.enabled` to `false`. The same is true for disabling the collection of metrics by setting `openTelemetry.metricsCollector.enabled` to `false`.
The `logsCollector` comes with a standard set of log-processing, such as adding cluster information and common labels for Journald events.
In addition we provide default pipelines for common log types. Currently the following log types have default configurations that can be enabled (requires `logsCollector.enabled` to `true`):
  1. KVM: `openTelemetry.logsCollector.kvmConfig`: Logs from Kernel-based Virtual Machines (KVMs) providing insights into virtualization activities, resource usage, and system performance
  2. Ceph:`openTelemetry.logsCollector.cephConfig`: Logs from Ceph storage systems, capturing information about cluster operations, performance metrics, and health status
 
These default configurations provide common labels and Grok parsing for logs emitted through the respective services.

Based on the backend selection the telemetry data will be exporter to the backend.

**Step 3:**

Greenhouse regularly performs integration tests that are bundled with **OpenTelemetry**. These provide feedback on whether all the necessary resources are installed and continuously up and running. You will find messages about this in the plugin status and also in the Greenhouse dashboard.

## Failover Connector

The **OpenTelemetry** Plugin comes with a [Failover Connector](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/failoverconnector) for OpenSearch for two users. The connector will periodically try to establish a stable connection for the prefered user (`failover_username_a`) and in case of a failed try, the connector will try to establish a connection with the fallback user (`failover_username_b`). This feature can be used to secure the shipping of logs in case of expiring credentials or password rotation.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| commonLabels | object | `{}` | common labels to apply to all resources |
| openTelemetry.cluster | string | `nil` |  |
| openTelemetry.customLabels | object | `{}` |  |
| openTelemetry.logsCollector.cephConfig.enabled | bool | `true` |  |
| openTelemetry.logsCollector.enabled | bool | `true` |  |
| openTelemetry.logsCollector.failover.enabled | bool | `true` |  |
| openTelemetry.logsCollector.kvmConfig.enabled | bool | `true` |  |
| openTelemetry.metricsCollector.enabled | bool | `false` |  |
| openTelemetry.openSearchLogs.endpoint | string | `nil` |  |
| openTelemetry.openSearchLogs.failover_password_a | string | `nil` |  |
| openTelemetry.openSearchLogs.failover_password_b | string | `nil` |  |
| openTelemetry.openSearchLogs.failover_username_a | string | `nil` |  |
| openTelemetry.openSearchLogs.failover_username_b | string | `nil` |  |
| openTelemetry.openSearchLogs.index | string | `nil` |  |
| openTelemetry.prometheus.additionalLabels | object | `{}` |  |
| openTelemetry.prometheus.podMonitor.enabled | bool | `true` |  |
| openTelemetry.prometheus.rules.additionalRuleLabels | string | `nil` |  |
| openTelemetry.prometheus.rules.annotations | object | `{}` |  |
| openTelemetry.prometheus.rules.create | bool | `true` |  |
| openTelemetry.prometheus.rules.disabled | list | `[]` |  |
| openTelemetry.prometheus.rules.labels | object | `{}` |  |
| openTelemetry.prometheus.serviceMonitor.enabled | bool | `true` |  |
| openTelemetry.region | string | `nil` |  |
| opentelemetry-operator | object | `{"admissionWebhooks":{"autoGenerateCert":{"recreate":false},"certManager":{"enabled":false},"failurePolicy":"Ignore"},"crds":{"create":false},"kubeRBACProxy":{"enabled":false},"manager":{"collectorImage":{"repository":"ghcr.io/cloudoperators/opentelemetry-collector-contrib","tag":"main"},"deploymentAnnotations":{"vpa-butler.cloud.sap/update-mode":"Auto"},"image":{"repository":"ghcr.io/open-telemetry/opentelemetry-operator/opentelemetry-operator","tag":"v0.116.0"},"serviceMonitor":{"enabled":true}},"nameOverride":"operator"}` | opentelemetry-operator is an upstream dependency, it is required that it is a separate block. This is customised configuration of the dependency. |
| testFramework.enabled | bool | `true` |  |
| testFramework.image.registry | string | `"ghcr.io"` |  |
| testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` |  |
| testFramework.image.tag | string | `"main"` |  |
| testFramework.imagePullPolicy | string | `"IfNotPresent"` |  |

### Examples

TBD
