---
title: Kubernetes monitoring
---

This Plugin is intended for monitoring Kubernetes clusters and is preconfigured to collect metrics from all Kubernetes components. It provides a standard set of alerting rules. Many of the useful alerts come from the [kubernetes-mixin](https://monitoring.mixins.dev/) project.

Components included in this Plugin:

- [Prometheus](https://prometheus.io/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- Prometheus adapter for Kubernetes metrics APIs (kubelet, apiserver, coredns, etcd)
- [Prometheus node exporter](https://github.com/prometheus/node_exporter)
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)

# Owner

1. Richard Tief (@richardtief) 
2. Tommy Sauer (@viennaa) 
3. Martin Vossen (@artherd42) 

### kube-monitoring prometheus-operator parameters

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `kubeMonitoring.prometheusOperator.enabled`                 | Manages Prometheus and Alertmanager components                                                                      | `true`                   |
| `kubeMonitoring.prometheusOperator.alertmanagerInstanceNamespaces`| Filter namespaces to look for prometheus-operator Alertmanager resources                                      | `[]`                     |
| `kubeMonitoring.prometheusOperator.alertmanagerConfigNamespaces`  | Filter namespaces to look for prometheus-operator AlertmanagerConfig resources                                | `[]`                     |
| `kubeMonitoring.prometheusOperator.prometheusInstanceNamespaces`  | Filter namespaces to look for prometheus-operator Prometheus resources                                        | `[]`                     |


### kube-monitoring Kubernetes components scraper configuration

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

### kube-monitoring Prometheus parameters

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `kubeMonitoring.prometheus.enabled`                         | Deploy a Prometheus instance                                                                                        | `true`                   |
| `kubeMonitoring.prometheus.annotations`                     | Annotations for Prometheus                                                                                          | `{}`                     |
| `kubeMonitoring.prometheus.tlsConfig.caCert`                | CA certificate to verify technical clients at Prometheus Ingress                                                    | `Secret`                 |
| `kubeMonitoring.prometheus.ingress.enabled`                 | Deploy Prometheus Ingress                                                                                           | `true`                   |
| `kubeMonitoring.prometheus.ingress.hosts`                   | Must be provided if Ingress is enabled.                                                   | `[]`                     |
| `kubeMonitoring.prometheus.ingress.ingressClassname`        | Specifies the ingress-controller                                                                                    | `nginx`                  |
| `kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage`   | How large the persistent volume should be to house the prometheus database. Default 50Gi. | `""`                     |
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

### kube-monitoring Alertmanager config parameters

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
kind: PluginConfig
metadata:
  name: kube-monitoring
spec:
  plugin: kube-monitoring
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

Example `PluginConfig` to deploy Prometheus with the `kube-monitoring` Plugin.

**NOTE:** If you are using kube-monitoring for the first time in your cluster, it is necessary to set `kubeMonitoring.prometheusOperator.enabled` to `true`.

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: PluginConfig
metadata:
  name: example-prometheus-name
spec:
  plugin: kube-monitoring
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
