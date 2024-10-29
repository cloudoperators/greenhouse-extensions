---
title: Kubernetes Monitoring
---

Learn more about the **kube-monitoring** plugin. Use it to activate Kubernetes monitoring for your Greenhouse cluster. 

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview 

Observability is often required for operation and automation of service offerings. To get the insights provided by an application and the container runtime environment, you need telemetry data in the form of _metrics_ or _logs_ sent to backends such as _Prometheus_ or _OpenSearch_. With the **kube-monitoring** Plugin, you will be able to cover the _metrics_ part of the observability stack.

This Plugin includes a pre-configured package of components that help getting started easy and efficient. At its core, an automated and managed _Prometheus_ installation is provided using the _prometheus-operator_. This is complemented by Prometheus target descriptions for the most common Kubernetes components providing metrics by default. In addition, [Cloud operators](https://cloudoperators.github.io/greenhouse) curated _Prometheus_ alerting rules and _Plutono_ dashboards are included to provide a comprehensive monitoring solution out of the box. 

Components included in this Plugin:

- [Prometheus](https://prometheus.io/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- Prometheus target descriptors for Kubernetes metrics APIs (e.g. kubelet, apiserver, coredns, etcd)
- [Prometheus node exporter](https://github.com/prometheus/node_exporter)
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)
- [kubernetes-operations](https://github.com/cloudoperators/kubernetes-operations)

## Quick start

This guide provides a quick and straightforward way how to use **kube-monitoring** as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster

**Step 1:**

You can install the `kube-monitoring` package in your cluster by installing it with [Helm](https://helm.sh/docs/helm/helm_install) manually or let the Greenhouse platform lifecycle it for you automatically. For the latter, you can either:
  1. Go to Greenhouse dashboard and select the **Kubernetes Monitoring** plugin from the catalog. Specify the cluster and required option values.
  2. Create and specify a `Plugin` resource in your Greenhouse central cluster according to the [examples](https://github.com/cloudoperators/greenhouse-extensions/blob/main/kube-monitoring/README.md#examples).

**Step 2:**

After installation, Greenhouse will provide a generated link to the Prometheus user interface. This is done via the annotation `greenhouse.sap/expose: “true”` at the Prometheus `Service` resource.

**Step 3:**

 Greenhouse regularly performs integration tests that are bundled with **kube-monitoring**. These provide feedback on whether all the necessary resources are installed and continuously up and running. You will find messages about this in the plugin status and also in the Greenhouse dashboard.

## Configuration

### Global options

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `global.commonLabels`                                        | Labels to add to all resources. This can be used to add a `support_group` or `service` label to all resources and alerting rules. | `true`   

### Prometheus-operator options

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `kubeMonitoring.prometheusOperator.enabled`                 | Manages Prometheus and Alertmanager components                                                                      | `true`                   |
| `kubeMonitoring.prometheusOperator.alertmanagerInstanceNamespaces`| Filter namespaces to look for prometheus-operator Alertmanager resources                                      | `[]`                     |
| `kubeMonitoring.prometheusOperator.alertmanagerConfigNamespaces`  | Filter namespaces to look for prometheus-operator AlertmanagerConfig resources                                | `[]`                     |
| `kubeMonitoring.prometheusOperator.prometheusInstanceNamespaces`  | Filter namespaces to look for prometheus-operator Prometheus resources                                        | `[]`                     |


### Kubernetes component scraper options

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `kubeMonitoring.kubernetesServiceMonitors.enabled`          | Flag to disable all the kubernetes component scrapers                                                               | `true`                   |
| `kubeMonitoring.kubeApiServer.enabled`                      | Component scraping the kube api server                                                                              | `true`                   |
| `kubeMonitoring.kubelet.enabled`                            | Component scraping the kubelet and kubelet-hosted cAdvisor                                                          | `true`                   |
| `kubeMonitoring.coreDns.enabled`                            | Component scraping coreDns. Use either this or kubeDns                                                              | `true`                   |
| `kubeMonitoring.kubeEtcd.enabled`                           | Component scraping etcd                                                                                             | `true`                   |
| `kubeMonitoring.kubeStateMetrics.enabled`                   | Component scraping kube state metrics                                                                               | `true`                   |
| `kubeMonitoring.nodeExporter.enabled`                       | Deploy node exporter as a daemonset to all nodes                                                                    | `true`                   |
| `kubeMonitoring.kubeControllerManager.enabled`              | Component scraping the kube controller manager                                                                      | `false`                  |
| `kubeMonitoring.kubeScheduler.enabled`                      | Component scraping kube scheduler                                                                                   | `false`                  |
| `kubeMonitoring.kubeProxy.enabled`                          | Component scraping kube proxy                                                                                       | `false`                  |
| `kubeMonitoring.kubeDns.enabled`                            | Component scraping kubeDns. Use either this or coreDns                                                              | `false`                  |

### Prometheus options

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `kubeMonitoring.prometheus.enabled`                         | Deploy a Prometheus instance                                                                                        | `true`                   |
| `kubeMonitoring.prometheus.annotations`                     | Annotations for Prometheus                                                                                          | `{}`                     |
| `kubeMonitoring.prometheus.tlsConfig.caCert`                | CA certificate to verify technical clients at Prometheus Ingress                                                    | `Secret`                 |
| `kubeMonitoring.prometheus.ingress.enabled`                 | Deploy Prometheus Ingress                                                                                           | `true`                   |
| `kubeMonitoring.prometheus.ingress.hosts`                   | Must be provided if Ingress is enabled.                                                   | `[]`                     |
| `kubeMonitoring.prometheus.ingress.ingressClassname`        | Specifies the ingress-controller                                                                                    | `nginx`                  |
| `kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage`   | How large the persistent volume should be to house the prometheus database. Default 50Gi. | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName`   |  The storage class to use for the persistent volume.                         | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.scrapeInterval`   | Interval between consecutive scrapes. Defaults to 30s                                                               | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.scrapeTimeout`    | Number of seconds to wait for target to respond before erroring                                                     | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.evaluationInterval`     | Interval between consecutive evaluations                                                                      | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.externalLabels`   | External labels to add to any time series or alerts when communicating with external systems like Alertmanager      | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.ruleSelector`     | PrometheusRules to be selected for target discovery. Defaults to `matchLabels: pluginconfig: <kubeMonitoring.fullnameOverride>`         | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.serviceMonitorSelector` | ServiceMonitors to be selected for target discovery. Defaults to `matchLabels: pluginconfig: <kubeMonitoring.fullnameOverride>`   | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.podMonitorSelector`     | PodMonitors to be selected for target discovery. Defaults to `matchLabels: pluginconfig: <kubeMonitoring.fullnameOverride>`       | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.probeSelector`    | Probes to be selected for target discovery. Defaults to `matchLabels: pluginconfig: <kubeMonitoring.fullnameOverride>`                  | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.scrapeConfigSelector`   | scrapeConfigs to be selected for target discovery. Defaults to `matchLabels: pluginconfig: <kubeMonitoring.fullnameOverride>`     | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.retention`        | How long to retain metrics                                                                                          | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.logLevel`         | Log level for Prometheus be configured in                                                                           | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.additionalScrapeConfigs` | Next to `ScrapeConfig` CRD, you can use AdditionalScrapeConfigs, which allows specifying additional Prometheus scrape configurations | `""`                 |
| `kubeMonitoring.prometheus.prometheusSpec.additionalArgs`   | Allows setting additional arguments for the Prometheus container                                                    | `[]`                 |

### Alertmanager options

| Name                                          | Description                                                                                                         | Value                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `alerts.enabled`                              | To send alerts to Alertmanager                                                                                      | `false`                  |
| `alerts.alertmanager.hosts`                   | List of Alertmanager hosts Prometheus can send alerts to                                                            | `[]`                     |
| `alerts.alertmanager.tlsConfig.cert`          | TLS certificate for communication with Alertmanager                                                                 | `Secret`                 |
| `alerts.alertmanager.tlsConfig.key`           | TLS key for communication with Alertmanager                                                                         | `Secret`                 |

## Examples

### Deploy kube-monitoring into a remote cluster

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: kube-monitoring
spec:
  pluginDefinition: kube-monitoring
  disabled: false
  optionValues:
    - name: kubeMonitoring.prometheus.prometheusSpec.retention
      value: 30d
    - name: kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage
      value: 100Gi
    - name: kubeMonitoring.prometheus.service.labels
      value:
        greenhouse.sap/expose: "true"
    - name: kubeMonitoring.prometheus.prometheusSpec.externalLabels
      value:
        cluster: example-cluster
        organization: example-org
        region: example-region
    - name: alerts.enabled
      value: true
    - name: alerts.alertmanagers.hosts
      value:
        - alertmanager.dns.example.com
    - name: alerts.alertmanagers.tlsConfig.cert
      valueFrom:
        secret:
          key: tls.crt
          name: tls-<org-name>-prometheus-auth
    - name: alerts.alertmanagers.tlsConfig.key
      valueFrom:
        secret:
          key: tls.key
          name: tls-<org-name>-prometheus-auth
```

### Deploy Prometheus only

Example `Plugin` to deploy Prometheus with the `kube-monitoring` Plugin.

**NOTE:** If you are using **kube-monitoring** for the first time in your cluster, it is necessary to set `kubeMonitoring.prometheusOperator.enabled` to `true`.

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: example-prometheus-name
spec:
  pluginDefinition: kube-monitoring
  disabled: false
  optionValues:
    - name: kubeMonitoring.defaultRules.create
      value: false
    - name: kubeMonitoring.kubernetesServiceMonitors.enabled
      value: false
    - name: kubeMonitoring.prometheusOperator.enabled
      value: false
    - name: kubeMonitoring.kubeStateMetrics.enabled
      value: false
    - name: kubeMonitoring.nodeExporter.enabled
      value: false
    - name: kubeMonitoring.prometheus.prometheusSpec.retention
      value: 30d
    - name: kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage
      value: 100Gi
    - name: kubeMonitoring.prometheus.service.labels
      value:
        greenhouse.sap/expose: "true"
    - name: kubeMonitoring.prometheus.prometheusSpec.externalLabels
      value:
        cluster: example-cluster
        organization: example-org
        region: example-region
    - name: alerts.enabled
      value: true
    - name: alerts.alertmanagers.hosts
      value:
        - alertmanager.dns.example.com
    - name: alerts.alertmanagers.tlsConfig.cert
      valueFrom:
        secret:
          key: tls.crt
          name: tls-<org-name>-prometheus-auth
    - name: alerts.alertmanagers.tlsConfig.key
      valueFrom:
        secret:
          key: tls.key
          name: tls-<org-name>-prometheus-auth
```
