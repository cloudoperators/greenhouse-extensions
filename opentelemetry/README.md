---
title: OpenTelemetry
---

Learn more about the **opentelemetry** Plugin. Use it to enable the ingestion, collection and export of telemetry signals (logs and metrics) for your Greenhouse cluster.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

OpenTelemetry is an observability framework and toolkit for creating and managing telemetry data such as metrics, logs and traces. It is vendor and tool agnostic, meaning it can be used with a variety of observability backends, including open source tools such as OpenSearch and Prometheus. 
The focus of the plugin is on the creation, collection, management and export of telemetry in Kubernetes. 

Components included in this Plugin:

- [Collector](https://github.com/open-telemetry/opentelemetry-collector)
- [Filelog Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/filelogreceiver)
- [OpenSearch Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/opensearchexporter)

## Note

It is not an observability backend like Jaeger, Prometheus or other commercial providers. The storage and visualization of telemetry is intentionally left to other tools.

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick start

This guide provides a quick and straightforward way to use **opentelemetry** as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.
- For logs, a OpenSearch instance to store. If you don't have one, reach out to your observability team to get access to one.
- For metrics, a Prometheus instance to store. If you don't have one, install a [kube-monitoring](https://cloudoperators.github.io/greenhouse/docs/reference/catalog/kube-monitoring) Plugin first.

**Step 1:**

... 

**Step 2:**

...

**Step 3:**

...

## Configuration

The Plugin will deploy the OpenTelemetry Operator which works as a manager for the collectors and auto-instrumentation of the workload. By default the Plugin will also 
1. Collect logs via the Filelog Receiver, process and export them to OpenSearch
    - You can disable the collecting of logs by setting `open_telemetry.LogCollector.enabled` to `false`. 
2. Collect and expose metrics using a Prometheus interface which defaults to port 8888
    - You can disable the collecting of metrics by setting `open_telemetry.MetricsCollector.enabled` to `false`. 

Contributors are welcome to provide additional collector configurations. 

### Parameters
| Name         | Description          | Type           | required           |
| ------------ | -------------------- |---------------- | ------------------ | 
`openTelemetry.logsCollector.enabled`    | Activates the standard configuration for logs | bool | `false`
`openTelemetry.metricsCollector.enabled` | Activates the standard configuration for metrics | bool | `false`
`openTelemetry.openSearchLogs.username` | Username for OpenSearch endpoint | secret | `false` |
`openTelemetry.openSearchLogs.password` | Password for OpenSearch endpoint | secret | `false` | 
`openTelemetry.openSearchLogs.endpoint` | Endpoint URL for OpenSearch      | secret | `false` | 
`openTelemetry.region`                   | Region label for logging         | string | `false` |
`openTelemetry.cluster`                  | Cluster label for logging        | string | `false` |
`openTelemetry.prometheus.additionalLabels`               | Label selector for Prometheus resources to be picked-up by the operator | map | `false` | 
`openTelemetry.prometheus.serviceMonitor.enabled` | Activates the service-monitoring for the Logs Collector  | bool | `false` | 
`openTelemetry.prometheus.podMonitor.enabled`       | Activates the pod-monitoring for the Logs Collector | bool | `false` | 
`openTelemetry-operator.admissionWebhooks.certManager.enabled` | Activate to use the CertManager for generating self-signed certificates | bool | `false` | 
`opentelemetry-operator.admissionWebhooks.autoGenerateCert.enabled` | Activate to use Helm to create self-signed certificates | bool | `false` | 
`opentelemetry-operator.admissionWebhooks.autoGenerateCert.recreate` | Activate to recreate the cert after a defined period (certPeriodDays default is 365) | bool | `false` | 
`opentelemetry-operator.kubeRBACProxy.enabled` | Activate to enable Kube-RBAC-Proxy for OpenTelemetry | bool | `false` | 
`opentelemetry-operator.manager.prometheusRule.defaultRules.enabled` | Activate to enable default rules for monitoring the OpenTelemetry Manager | bool | `false` | 
`opentelemetry-operator.manager.prometheusRule.enabled` | Activate to enable rules for monitoring the OpenTelemetry Manager | bool | `false` | 

### Examples

TBD
