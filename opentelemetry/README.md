---
title: OpenTelemetry
---

This Plugin is intended for ingesting, generating, collecting, and exporting telemetry data (metrics, logs, and traces). 

Components included in this Plugin:

- [Collector](https://github.com/open-telemetry/opentelemetry-collector)
- [Filelog Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/filelogreceiver)
- [OpenSearch Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/opensearchexporter)
- ServiceMonitor to ingest the metrics of the OpenTelemetry Collector in Prometheus 

The Plugin will deploy the OpenTelemetry Operator which works as a manager for the collectors and auto-instrumentation of the workload. By default the Plugin will also 
1. Collect logs via the Filelog Receiver, process and export them to OpenSearch
    - You can disable the collecting of logs by setting `open_telemetry.LogCollector.enabled` to `false`. 
2. Collect and expose metrics using a Prometheus interface which defaults to port 8888
    - You can disable the collecting of metrics by setting `open_telemetry.MetricsCollector.enabled` to `false`. 

Contributors are welcome to provide additional collector configurations. 

# Owner

1. Timo Johner (@timojohlo) 
2. Olaf Heydorn (@kuckkuck) 
3. Tommy Sauer (@viennaa) 

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
`prometheusRules.additionalRuleLabels`               | Additional labels for PrometheusRule alerts | map | `false` | 
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