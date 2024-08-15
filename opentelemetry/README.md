---
title: OpenTelemetry
---

This Plugin is intended for ingesting, generating, collecting, and exporting telemetry data (metrics, logs, and traces). 

Components included in this Plugin:

- [Collector](https://github.com/open-telemetry/opentelemetry-collector)
- [Filelog Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/filelogreceiver)
- [OpenSearch Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/opensearchexporter)
- ServiceMonitor to scrape logs statically into prometheus infra-frontend

The Plugin will deploy the OpenTelemetry Operator which functions as a manager for the collectors and auto-instrumentation of the workload. Per default the Plugin will also 
1. Collect logs via the Filelog Receiver, process and export them to OpenSearch
    - You can disable the collecting of logs by setting `open_telemetry.LogCollector.enabled` to `false`. 
2. Collect and expose metrics using a Prometheus interface which defaults to port 8888
    - You can disable the collecting of metrics by setting `open_telemetry.MetricsCollector.enabled` to `false`. 

Contributors are open to provide additional collector configurations. 

# Owner

1. Timo Johner (@timojohlo) 
2. Olaf Heydorn (@kuckkuck) 
3. Tommy Sauer (@viennaa) 

### Parameters
| Name         | Description          | Type           | required           |
| ------------ | -------------------- |---------------- | ------------------ | 
`open_telemetry.LogsCollector.enabled`    | Enable or Disable the standard configuration for logs | bool | `false`
`open_telemetry.MetricsCollector.enabled` | Enable or Disable the standard configuration for metrics | bool | `false`
`open_telemetry.opensearch_logs.username` | Username for OpenSearch endpoint | secret | `false` |
`open_telemetry.opensearch_logs.password` | Password for OpenSearch endpoint | secret | `false` | 
`open_telemetry.opensearch_logs.endpoint` | Endpoint URL for OpenSearch      | secret | `false` | 
`open_telemetry.region`                   | Region label for logging         | string | `false` |
`open_telemetry.cluster`                  | Cluster label for logging        | string | `false` |
`open_telemetry.prometheus`               | Label for Prometheus Service Monitoring | string | `false` | 
`open_telemetry.podMonitor.enabled`       | Check to enable the Pod Monitor | bool | `false` | 
`opentelemetry-operator.admissionWbhooks.certManager.enabled` | Check to use certManager for generating self-signed certificates | bool | `false` | 
`opentelemetry-operator.admissionWebhooks.autoGenerateCert.enabled` | Check to use Helm to create self-signed certificates | bool | `false` | 
`opentelemetry-operator.admissionWebhooks.autoGenerateCert.recreate` | Recreate the cert after a defined period (certPeriodDays default is 365) | bool | `false` | 
`opentelemetry-operator.kubeRBACProxy.enabled` | Check to enable kube-rbac-proxy for OpenTelemetry | bool | `false` | 
`opentelemetry-operator.manager.prometheusRule.defaultRules.enabled` | Check to enable default rules for monitoring the manager | bool | `false` | 
`opentelemetry-operator.manager.prometheusRule.enabled` | Check to enable rules for monitoring the manager | bool | `false` | 
`opentelemetry-operator.manager.serviceMonitor.enabled` | Check to enable the Service Monitor | bool | `false` | 

### Examples

TBD