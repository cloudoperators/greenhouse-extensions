---
title: OpenTelemetry
---

Learn more about the **OpenTelemetry** Plugin. Use it to enable the ingestion, collection and export of telemetry signals (logs and metrics) for your Greenhouse cluster.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

OpenTelemetry is an observability framework and toolkit for creating and managing telemetry data such as metrics, logs and traces. Unlike other observability tools, OpenTelemetry is vendor and tool agnostic, meaning it can be used with a variety of observability backends, including open source tools such as _OpenSearch_ and _Prometheus_. 

The focus of the plugin is to provide easy-to-use configurations for common use cases of receiving, processing and exporting telemetry data in Kubernetes. The storage and visualization of the same is intentionally left to other tools.

Components included in this Plugin:

- [Operator](https://opentelemetry.io/docs/kubernetes/operator/)
- [Collector](https://github.com/open-telemetry/opentelemetry-collector)
- [Receivers](https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/README.md)
    - [Filelog Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/filelogreceiver)
    - [k8events Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/k8seventsreceiver)
    - [journald Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/journaldreceiver)
    - [prometheus/internal](https://opentelemetry.io/docs/collector/internal-telemetry/)
- [OpenSearch Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/opensearchexporter)

## Architecture

 TBD: Architecture picture

## Note

It is the intention to add more configuration over time and contributions of your very own configuration is highly appreciated. If you discover bugs or want to add functionality to the plugin, feel free to create a pull request.

## Quick Start

This guide provides a quick and straightforward way to use **OpenTelemetry** as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.
- For logs, a OpenSearch instance to store. If you don't have one, reach out to your observability team to get access to one.
- For metrics, a Prometheus instance to store. If you don't have one, install a [kube-monitoring](https://cloudoperators.github.io/greenhouse/docs/reference/catalog/kube-monitoring) Plugin first.w

**Step 1:**

You can install the `OpenTelemetry` package in your cluster by installing it with [Helm](https://helm.sh/docs/helm/helm_install) manually or let the Greenhouse platform lifecycle do it for you automatically. For the latter, you can either:
  1. Go to Greenhouse dashboard and select the **OpenTelemetry** plugin from the catalog. Specify the cluster and required option values.
  2. Create and specify a `Plugin` resource in your Greenhouse central cluster according to the [examples](#examples).

**Step 2:**

The package will deploy the OpenTelemetry Operator which works as a manager for the collectors and auto-instrumentation of the workload. By default, the package will include a configuration for collecting metrics and logs. The log-collector is currently processing data from the [preconfigured receivers](#Overview): 
- Files via the Filelog Receiver
- Kubernetes Events from the Kubernetes API server
- Journald events from systemd journal
- its own metrics

You can disable the collection of logs by setting `open_telemetry.LogCollector.enabled` to `false`. The same is true for disabling metrics: `open_telemetry.MetricsCollector.enabled` to `false`. 

Based on the backend selection the telemetry data will be exporter to the backend.

**Step 3:**

Greenhouse regularly performs integration tests that are bundled with **OpenTelemetry**. These provide feedback on whether all the necessary resources are installed and continuously up and running. You will find messages about this in the plugin status and also in the Greenhouse dashboard. 

## Configuration

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
