---
title: Prometheus
---

Learn more about the **prometheus** plugin. Use it to deploy a single Prometheus for your Greenhouse cluster. 

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview 

Observability is often required for operation and automation of service offerings. To get the insights provided by an application and the container runtime environment, you need telemetry data in the form of _metrics_ or _logs_ sent to backends such as _Prometheus_ or _OpenSearch_. With the **prometheus** Plugin, you will be able to cover the _metrics_ part of the observability stack.

This Plugin includes a pre-configured package of Prometheus that help make getting started easy and efficient. At its core, an automated and managed _Prometheus_ installation is provided using the _prometheus-operator_.

Components included in this Plugin:

- [Prometheus](https://prometheus.io/)
- **optional:** [Prometheus Operator](https://prometheus-operator.dev/)

## Disclaimer

It is not meant to be a comprehensive package that covers all scenarios. If you are an expert, feel free to configure the plugin according to your needs.

The Plugin is a configured [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md) Helm chart which helps to keep track of versions and community updates. The intention is, to deliver a pre-configured package that work out of the box and can be extended by following the [guide](#extension-of-the-plugin). 

Also worth to mention, we reuse the existing **kube-monitoring** Greenhouse plugin helm chart, which already preconfigures Prometheus just by disabling the Kubernetes component scrapers and exporters. 

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick start

This guide provides a quick and straightforward way to deploy **prometheus** as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.

- Installed prometheus-operator and it's custom resource definitions (CRDs). As a foundation we recommend installing the `kube-monitoring` plugin first in your cluster to provide the prometheus-operator and it's CRDs. There are two paths to do it:
  1. Go to Greenhouse dashboard and select the **Prometheus** plugin from the catalog. Specify the cluster and required option values.
  2. Create and specify a `Plugin` resource in your Greenhouse central cluster according to the [examples](#examples).

**Step 1:**

If you want to run the **prometheus** plugin without installing **kube-monitoring** in the first place, then you need to switch `kubeMonitoring.prometheusOperator.enabled` and `kubeMonitoring.crds.enabled` to `true`. 

**Step 2:**

After installation, Greenhouse will provide a generated link to the Prometheus user interface. This is done via the annotation `greenhouse.sap/expose: “true”` at the Prometheus `Service` resource.

**Step 3:**

Greenhouse regularly performs integration tests that are bundled with **prometheus**. These provide feedback on whether all the necessary resources are installed and continuously up and running. You will find messages about this in the plugin status and also in the Greenhouse dashboard.

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
| `kubeMonitoring.prometheus.prometheusSpec.ruleSelector`     | PrometheusRules to be selected for target discovery. Defaults to `{ matchLabels: { plugin: <metadata.name> } }`         | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.serviceMonitorSelector` | ServiceMonitors to be selected for target discovery. Defaults to `{ matchLabels: { plugin: <metadata.name> } }`   | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.podMonitorSelector`     | PodMonitors to be selected for target discovery. Defaults to `{ matchLabels: { plugin: <metadata.name> } }`       | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.probeSelector`    | Probes to be selected for target discovery. Defaults to `{ matchLabels: { plugin: <metadata.name> } }`                  | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.scrapeConfigSelector`   | scrapeConfigs to be selected for target discovery. Defaults to `{ matchLabels: { plugin: <metadata.name> } }`     | `{}`                     |
| `kubeMonitoring.prometheus.prometheusSpec.retention`        | How long to retain metrics                                                                                          | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.logLevel`         | Log level to be configured for Prometheus                                                                           | `""`                     |
| `kubeMonitoring.prometheus.prometheusSpec.additionalScrapeConfigs` | Next to `ScrapeConfig` CRD, you can use AdditionalScrapeConfigs, which allows specifying additional Prometheus scrape configurations | `""`                 |
| `kubeMonitoring.prometheus.prometheusSpec.additionalArgs`   | Allows setting additional arguments for the Prometheus container                                                    | `[]`                 |

### Alertmanager options

| Name                                          | Description                                                                                                         | Value                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `alerts.enabled`                              | To send alerts to Alertmanager                                                                                      | `false`                  |
| `alerts.alertmanager.hosts`                   | List of Alertmanager hosts Prometheus can send alerts to                                                            | `[]`                     |
| `alerts.alertmanager.tlsConfig.cert`          | TLS certificate for communication with Alertmanager                                                                 | `Secret`                 |
| `alerts.alertmanager.tlsConfig.key`           | TLS key for communication with Alertmanager                                                                         | `Secret`                 |

## Service Discovery

The **prometheus** Plugin provides a PodMonitor to automatically discover the Prometheus metrics of the Kubernetes Pods in any Namespace. The PodMonitor is configured to detect the `metrics` endpoint of the Pods if the following annotations are set:

```yaml 
metadata:
  annotations:
    greenhouse/scrape: “true”
    greenhouse/target: <prometheus plugin name>
``` 

*Note:* The annotations needs to be added manually to have the pod scraped and the port name needs to match.

## Examples

### Deploy kube-monitoring into a remote cluster

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: prometheus
spec:
  pluginDefinition: prometheus
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
          name: tls-prometheus-<org-name>
    - name: alerts.alertmanagers.tlsConfig.key
      valueFrom:
        secret:
          key: tls.key
          name: tls-prometheus-<org-name>
```

### Extension of the plugin

**prometheus** can be extended with your own alerting rules and target configurations via the Custom Resource Definitions (CRDs) of the prometheus-operator. The user-defined resources to be incorporated with the desired configuration are defined via _label selections_.

The CRD `PrometheusRule` enables the definition of alerting and recording rules that can be used by _Prometheus_ or _Thanos Rule_ instances. Alerts and recording rules are reconciled and dynamically loaded by the operator without having to restart _Prometheus_ or _Thanos Rule_.

**prometheus** will automatically discover and load the rules that match labels `plugin: <plugin-name>`.

**Example:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: example-prometheus-rule
  labels:
    plugin: <metadata.name> 
    ## e.g plugin: prometheus-network
spec:
 groups:
   - name: example-group
     rules:
     ...
```

The CRDs  `PodMonitor`, `ServiceMonitor`, `Probe` and `ScrapeConfig` allow the definition of a set of target endpoints to be scraped by **prometheus**. The operator will automatically discover and load the configurations that match labels `plugin: <plugin-name>`.

**Example:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: example-pod-monitor
  labels:
    plugin: <metadata.name> 
    ## e.g plugin: prometheus-network
spec:
  selector:
    matchLabels:
      app: example-app
  namespaceSelector:
    matchNames:
      - example-namespace
  podMetricsEndpoints:
    - port: http
  ...
```
