---
title: Kubernetes Monitoring
---

Learn more about the **kube-monitoring** plugin. Use it to activate Kubernetes monitoring for your Greenhouse cluster.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

Observability is often required for operation and automation of service offerings. To get the insights provided by an application and the container runtime environment, you need telemetry data in the form of _metrics_ or _logs_ sent to backends such as _Prometheus_ or _OpenSearch_. With the **kube-monitoring** Plugin, you will be able to cover the _metrics_ part of the observability stack.

This Plugin includes a pre-configured package of components that help make getting started easy and efficient. At its core, an automated and managed _Prometheus_ installation is provided using the _prometheus-operator_. This is complemented by Prometheus target configuration for the most common Kubernetes components providing metrics by default. In addition, [Cloud operators](https://github.com/cloudoperators/kubernetes-operations) curated _Prometheus_ alerting rules and _Plutono_ dashboards are included to provide a comprehensive monitoring solution out of the box.

![kube-monitoring](img/kube-monitoring-setup.png)

Components included in this Plugin:

- [Prometheus](https://prometheus.io/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- Prometheus target configuration for Kubernetes metrics APIs (e.g. kubelet, apiserver, coredns, etcd)
- [Prometheus node exporter](https://github.com/prometheus/node_exporter)
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)
- [kubernetes-operations](https://github.com/cloudoperators/kubernetes-operations)

## Disclaimer

It is not meant to be a comprehensive package that covers all scenarios. If you are an expert, feel free to configure the plugin according to your needs.

The Plugin is a deeply configured [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md) Helm chart which helps to keep track of versions and community updates.

It is intended as a platform that can be extended by following the [guide](#extension-of-the-plugin).

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick start

This guide provides a quick and straightforward way to use **kube-monitoring** as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.

**Step 1:**

You can install the `kube-monitoring` package in your cluster by installing it with [Helm](https://helm.sh/docs/helm/helm_install) manually or let the Greenhouse platform lifecycle it for you automatically. For the latter, you can either:
  1. Go to Greenhouse dashboard and select the **Kubernetes Monitoring** plugin from the catalog. Specify the cluster and required option values.
  2. Create and specify a `Plugin` resource in your Greenhouse central cluster according to the [examples](#examples).

**Step 2:**

After installation, Greenhouse will provide a generated link to the Prometheus user interface. This is done via the annotation `greenhouse.sap/expose: “true”` at the Prometheus `Service` resource.

**Step 3:**

Greenhouse regularly performs integration tests that are bundled with **kube-monitoring**. These provide feedback on whether all the necessary resources are installed and continuously up and running. You will find messages about this in the plugin status and also in the Greenhouse dashboard.

## Values

### Alertmanager

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| alerts.alertmanagers.hosts | list | `[]` | List of Alertmanager hosts Prometheus can send alerts to |
| alerts.alertmanagers.tlsConfig | object | `{"cert":"","key":""}` | Overrides tls certificate to authenticate with Alertmanager |
| alerts.alertmanagers.tlsConfig.cert | string | `""` | TLS certificate for communication with Alertmanager |
| alerts.alertmanagers.tlsConfig.key | string | `""` | TLS key for communication with Alertmanager |
| alerts.enabled | bool | `false` | Enable Alertmanager |

### Global Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.commonLabels | object | `{}` | Labels to add to all resources. This can be used to add a support_group or service label to all resources and alerting rules. |

### Default Rules

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| kubeMonitoring.defaultRules.additionalRuleLabels | object | `{}` | Additional labels for PrometheusRule alerts. E.g. support_group and service. |
| kubeMonitoring.defaultRules.rules.alertmanager | bool | `false` | Enable alertmanager rules for monitoring Alertmanager |
| kubeMonitoring.defaultRules.rules.configReloaders | bool | `false` | Enable rules for monitoring Prometheus config reloaders |
| kubeMonitoring.defaultRules.rules.etcd | bool | `false` | Enable etcd rules for monitoring etcd |
| kubeMonitoring.defaultRules.rules.general | bool | `false` | Enable general rules for cluster monitoring |
| kubeMonitoring.defaultRules.rules.k8sContainerCpuUsageSecondsTotal | bool | `false` | Enable rules for monitoring container CPU usage |
| kubeMonitoring.defaultRules.rules.k8sContainerMemoryCache | bool | `false` | Enable rules for monitoring container memory cache usage |
| kubeMonitoring.defaultRules.rules.k8sContainerMemoryRss | bool | `false` | Enable rules for monitoring container memory RSS usage |
| kubeMonitoring.defaultRules.rules.k8sContainerMemorySwap | bool | `false` | Enable rules for monitoring container memory swap usage |
| kubeMonitoring.defaultRules.rules.k8sContainerMemoryWorkingSetBytes | bool | `false` | Enable rules for monitoring container memory working set bytes |
| kubeMonitoring.defaultRules.rules.k8sContainerResource | bool | `false` | Enable rules for monitoring container resource usage |
| kubeMonitoring.defaultRules.rules.k8sPodOwner | bool | `false` | Enable rules for monitoring pod owner relationships |
| kubeMonitoring.defaultRules.rules.kubeApiserverAvailability | bool | `false` | Enable rules for monitoring API server availability |
| kubeMonitoring.defaultRules.rules.kubeApiserverBurnrate | bool | `false` | Enable rules for monitoring API server burn rate |
| kubeMonitoring.defaultRules.rules.kubeApiserverHistogram | bool | `false` | Enable histogram rules for API server |
| kubeMonitoring.defaultRules.rules.kubeApiserverSlos | bool | `false` | Enable SLO rules for API server |
| kubeMonitoring.defaultRules.rules.kubeControllerManager | bool | `false` | Enable rules for monitoring the kube-controller-manager |
| kubeMonitoring.defaultRules.rules.kubePrometheusGeneral | bool | `false` | Enable general rules for kube-prometheus |
| kubeMonitoring.defaultRules.rules.kubePrometheusNodeRecording | bool | `false` | Enable node recording rules for kube-prometheus |
| kubeMonitoring.defaultRules.rules.kubeProxy | bool | `false` | Enable rules for monitoring kube-proxy |
| kubeMonitoring.defaultRules.rules.kubeSchedulerAlerting | bool | `false` | Enable alerting rules for kube-scheduler |
| kubeMonitoring.defaultRules.rules.kubeSchedulerRecording | bool | `false` | Enable recording rules for kube-scheduler |
| kubeMonitoring.defaultRules.rules.kubeStateMetrics | bool | `false` | Enable rules for monitoring kube-state-metrics |
| kubeMonitoring.defaultRules.rules.kubelet | bool | `false` | Enable rules for monitoring kubelet |
| kubeMonitoring.defaultRules.rules.kubernetesApps | bool | `false` | Enable rules for monitoring Kubernetes applications |
| kubeMonitoring.defaultRules.rules.kubernetesResources | bool | `false` | Enable rules for monitoring Kubernetes resources |
| kubeMonitoring.defaultRules.rules.kubernetesStorage | bool | `false` | Enable rules for monitoring Kubernetes storage |
| kubeMonitoring.defaultRules.rules.kubernetesSystem | bool | `false` | Enable rules for monitoring Kubernetes system components |
| kubeMonitoring.defaultRules.rules.network | bool | `false` | Enable rules for monitoring network-related metrics |
| kubeMonitoring.defaultRules.rules.node | bool | `false` | Enable rules for monitoring node-related metrics |
| kubeMonitoring.defaultRules.rules.nodeExporterAlerting | bool | `false` | Enable alerting rules for node-exporter |
| kubeMonitoring.defaultRules.rules.nodeExporterRecording | bool | `false` | Enable recording rules for node-exporter |
| kubeMonitoring.defaultRules.rules.prometheus | bool | `true` | Enable useful alerting rules for self-monitoring Prometheus |
| kubeMonitoring.defaultRules.rules.prometheusOperator | bool | `true` | Enable useful alerting rules for self-monitoring Prometheus Operator |
| kubeMonitoring.defaultRules.rules.windows | bool | `false` | Enable rules for monitoring Windows-specific metrics |

### Prometheus

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| kubeMonitoring.prometheus.ingress.enabled | bool | `false` | Deploy Prometheus Ingess |
| kubeMonitoring.prometheus.ingress.ingressClassName | string | `"nginx"` | Specifies the ingress-controller |
| kubeMonitoring.prometheus.persesDatasource | bool | `true` | Deploys a Perses datasource ConfigMap for this Prometheus |
| kubeMonitoring.prometheus.plutonoDatasource | bool | `true` | Deploys a Plutono datasource config Secret for this Prometheus |
| kubeMonitoring.prometheus.prometheusSpec.podMonitorSelector | object | `{"matchLabels":{"plugin":"{{ $.Release.Name }}"}}` | PodMonitors to be selected for target discovery. If {}, it will select all PodMonitors |
| kubeMonitoring.prometheus.prometheusSpec.probeSelector | object | `{"matchLabels":{"plugin":"{{ $.Release.Name }}"}}` | Probes to be selected for target discovery. If {}, it will select all Probes |
| kubeMonitoring.prometheus.prometheusSpec.ruleSelector | object | `{"matchLabels":{"plugin":"{{ $.Release.Name }}"}}` | PrometheusRules to be selected for target discovery. If {}, it will select all PrometheusRules |
| kubeMonitoring.prometheus.prometheusSpec.scrapeConfigSelector | object | `{"matchLabels":{"plugin":"{{ $.Release.Name }}"}}` | scrapeConfigs to be selected for target discovery. If {}, it will select all scrapeConfigs |
| kubeMonitoring.prometheus.prometheusSpec.serviceMonitorSelector | object | `{"matchLabels":{"plugin":"{{ $.Release.Name }}"}}` | ServiceMonitors to be selected for target discovery. If {}, it will select all ServiceMonitors |
| kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage | string | `"50Gi"` | How large the persistent volume should be to house the prometheus database. |
| kubeMonitoring.prometheus.service.labels | object | `{"greenhouse.sap/expose":"true"}` | Add the label to expose the Prometheus service via Greenhouse. |

### Service Discovery

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| kubeMonitoring.serviceDiscovery.pods.additionalMetricRelabelings | list | `[]` | MetricRelabelConfigs to apply to samples after scraping, but before ingestion. # ref: https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/api.md#relabelconfig |
| kubeMonitoring.serviceDiscovery.pods.additionalRelabelings | list | `[]` | RelabelConfigs to apply to samples before scraping ref: https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/api.md#relabelconfig |
| kubeMonitoring.serviceDiscovery.pods.enabled | bool | `true` | Enable pod discovery |
| kubeMonitoring.serviceDiscovery.pods.jobLabel | string | `""` | Pod label for use in assembling a job name of the form <label value>-<port>  If no label is specified, the pod endpoint name is used. |
| kubeMonitoring.serviceDiscovery.pods.limitToPrometheusTargets | bool | `true` | To avoid multiple pod scrapes from different Prometheis, service discovery can be limited to one target |
| kubeMonitoring.serviceDiscovery.pods.namespaceSelector | object | `{"any":true}` | Namespaces from which pods are selected |
| kubeMonitoring.serviceDiscovery.pods.port | string | `"metrics"` | Monitor Pods with the following port name |

### Other Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| blackboxExporter.enabled | bool | `false` |  |
| kubeMonitoring.alertmanager.enabled | bool | `false` |  |
| kubeMonitoring.cleanPrometheusOperatorObjectNames | bool | `true` |  |
| kubeMonitoring.crds.enabled | bool | `true` |  |
| kubeMonitoring.dashboards.create | bool | `true` |  |
| kubeMonitoring.dashboards.plutonoSelectors[0].name | string | `"plutono-dashboard"` |  |
| kubeMonitoring.dashboards.plutonoSelectors[0].value | string | `"\"true\""` |  |
| kubeMonitoring.defaultRules.create | bool | `true` |  |
| kubeMonitoring.grafana.enabled | bool | `false` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[0] | string | `"cronjobs=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[10] | string | `"pods=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[11] | string | `"secrets=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[12] | string | `"services=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[13] | string | `"statefulsets=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[1] | string | `"daemonsets=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[2] | string | `"deployments=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[3] | string | `"endpoints=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[4] | string | `"ingresses=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[5] | string | `"jobs=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[6] | string | `"namespaces=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[7] | string | `"nodes=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[8] | string | `"persistentvolumes=[*]"` |  |
| kubeMonitoring.kube-state-metrics.metricLabelsAllowlist[9] | string | `"persistentvolumeclaims=[*]"` |  |
| kubeMonitoring.kubeControllerManager.enabled | bool | `false` |  |
| kubeMonitoring.kubeProxy.enabled | bool | `false` |  |
| kubeMonitoring.kubeScheduler.enabled | bool | `false` |  |
| kubeMonitoring.kubelet.enabled | bool | `true` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[0].action | string | `"drop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[0].regex | string | `"container_cpu_(cfs_throttled_seconds_total|load_average_10s|system_seconds_total|user_seconds_total)"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[0].sourceLabels[0] | string | `"__name__"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[1].action | string | `"drop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[1].regex | string | `"container_fs_(io_current|io_time_seconds_total|io_time_weighted_seconds_total|reads_merged_total|sector_reads_total|sector_writes_total|writes_merged_total)"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[1].sourceLabels[0] | string | `"__name__"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[2].action | string | `"drop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[2].regex | string | `"container_memory_(mapped_file|swap)"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[2].sourceLabels[0] | string | `"__name__"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[3].action | string | `"drop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[3].regex | string | `"container_(file_descriptors|tasks_state|threads_max)"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[3].sourceLabels[0] | string | `"__name__"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[4].action | string | `"drop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[4].regex | string | `"container_spec.*"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[4].sourceLabels[0] | string | `"__name__"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[5].action | string | `"drop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[5].regex | string | `".+;"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[5].sourceLabels[0] | string | `"id"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[5].sourceLabels[1] | string | `"pod"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[6].action | string | `"replace"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[6].regex | string | `"^/system\\.slice/(.+)\\.service$"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[6].replacement | string | `"${1}"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[6].sourceLabels[0] | string | `"id"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[6].targetLabel | string | `"systemd_service_name"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[7].action | string | `"drop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[7].regex | string | `"^$"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[7].sourceLabels[0] | string | `"container"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[8].action | string | `"labeldrop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[8].regex | string | `"^id$"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[9].action | string | `"labeldrop"` |  |
| kubeMonitoring.kubelet.serviceMonitor.cAdvisorMetricRelabelings[9].regex | string | `"^name$"` |  |
| kubeMonitoring.prometheus-node-exporter.extraArgs[0] | string | `"--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)"` |  |
| kubeMonitoring.prometheus-node-exporter.extraArgs[1] | string | `"--collector.filesystem.ignored-fs-types=^(autofs|binfmt_misc|bpf|cgroup|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tmpfs|tracefs)$$"` |  |
| kubeMonitoring.prometheus-node-exporter.extraArgs[2] | string | `"--collector.systemd.enable-task-metrics"` |  |
| kubeMonitoring.prometheus-node-exporter.extraArgs[3] | string | `"--collector.systemd.enable-restarts-metrics"` |  |
| kubeMonitoring.prometheus-node-exporter.extraArgs[4] | string | `"--collector.systemd.enable-start-time-metrics"` |  |
| kubeMonitoring.prometheus-node-exporter.extraArgs[5] | string | `"--collector.processes"` |  |
| kubeMonitoring.prometheus-node-exporter.extraArgs[6] | string | `"--collector.mountstats"` |  |
| kubeMonitoring.prometheus-node-exporter.prometheus.monitor.relabelings[0].action | string | `"replace"` |  |
| kubeMonitoring.prometheus-node-exporter.prometheus.monitor.relabelings[0].regex | string | `"^(.*)$"` |  |
| kubeMonitoring.prometheus-node-exporter.prometheus.monitor.relabelings[0].replacement | string | `"$1"` |  |
| kubeMonitoring.prometheus-node-exporter.prometheus.monitor.relabelings[0].separator | string | `";"` |  |
| kubeMonitoring.prometheus-node-exporter.prometheus.monitor.relabelings[0].sourceLabels[0] | string | `"__meta_kubernetes_pod_node_name"` |  |
| kubeMonitoring.prometheus-node-exporter.prometheus.monitor.relabelings[0].targetLabel | string | `"node"` |  |
| kubeMonitoring.prometheus.ingress.annotations."kubernetes.io/tls-acme" | string | `"true"` |  |
| kubeMonitoring.prometheus.ingress.annotations."nginx.ingress.kubernetes.io/auth-tls-secret" | string | `"{{ $.Release.Namespace }}/{{ $.Release.Namespace }}-ca-bundle"` |  |
| kubeMonitoring.prometheus.ingress.annotations."nginx.ingress.kubernetes.io/auth-tls-verify-client" | string | `"true"` |  |
| kubeMonitoring.prometheus.ingress.annotations."nginx.ingress.kubernetes.io/auth-tls-verify-depth" | string | `"3"` |  |
| kubeMonitoring.prometheus.ingress.annotations.disco | string | `"true"` |  |
| kubeMonitoring.prometheus.prometheusSpec.additionalAlertManagerConfigsSecret.key | string | `"config.yaml"` |  |
| kubeMonitoring.prometheus.prometheusSpec.additionalAlertManagerConfigsSecret.name | string | `"{{ $.Release.Name }}-alertmanager-config"` |  |
| kubeMonitoring.prometheus.prometheusSpec.additionalAlertRelabelConfigsSecret.key | string | `"relabelConfig.yaml"` |  |
| kubeMonitoring.prometheus.prometheusSpec.additionalAlertRelabelConfigsSecret.name | string | `"{{ $.Release.Name }}-alertmanager-config"` |  |
| kubeMonitoring.prometheus.prometheusSpec.secrets[0] | string | `"tls-prometheus-{{ .Release.Name }}"` |  |
| kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.metadata.labels.app | string | `"{{ $.Release.Name }}-prometheus"` |  |
| kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.metadata.labels.plugin | string | `"{{ $.Release.Name }}"` |  |
| kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.metadata.labels.plugindefinition | string | `"kube-monitoring"` |  |
| kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.metadata.name | string | `"{{ $.Release.Name }}"` |  |
| kubeMonitoring.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes[0] | string | `"ReadWriteOnce"` |  |
| kubeMonitoring.thanosRuler.enabled | bool | `false` |  |
| kubeMonitoring.windowsMonitoring.enabled | bool | `false` |  |
| kubernetes-operations.prometheusRules.ruleSelector[0].name | string | `"plugin"` |  |
| kubernetes-operations.prometheusRules.ruleSelector[0].value | string | `"{{ $.Release.Name }}"` |  |
| testFramework.enabled | bool | `true` |  |
| testFramework.image.registry | string | `"ghcr.io"` |  |
| testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` |  |
| testFramework.image.tag | string | `"main"` |  |
| testFramework.imagePullPolicy | string | `"IfNotPresent"` |  |                                                                     | `Secret`                 |

## Service Discovery

The **kube-monitoring** Plugin provides a PodMonitor to automatically discover the Prometheus metrics of the Kubernetes Pods in any Namespace. The PodMonitor is configured to detect the `metrics` endpoint of the Pods if the following annotations are set:

```yaml
metadata:
  annotations:
    greenhouse/scrape: “true”
    greenhouse/target: <kube-monitoring plugin name>
```

*Note:* The annotations needs to be added manually to have the pod scraped and the port name needs to match.

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

### Extension of the plugin

**kube-monitoring** can be extended with your own _Prometheus_ alerting rules and target configurations via the Custom Resource Definitions (CRDs) of the _Prometheus_ operator. The user-defined resources to be incorporated with the desired configuration are defined via _label selections_.

The CRD `PrometheusRule` enables the definition of alerting and recording rules that can be used by _Prometheus_ or _Thanos Rule_ instances. Alerts and recording rules are reconciled and dynamically loaded by the operator without having to restart _Prometheus_ or _Thanos Rule_.

**kube-monitoring** _Prometheus_ will automatically discover and load the rules that match labels `plugin: <plugin-name>`.

**Example:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: example-prometheus-rule
  labels:
    plugin: <metadata.name>
    ## e.g plugin: kube-monitoring
spec:
 groups:
   - name: example-group
     rules:
     ...
```

The CRDs  `PodMonitor`, `ServiceMonitor`, `Probe` and `ScrapeConfig` allow the definition of a set of target endpoints to be scraped by _Prometheus_. The operator will automatically discover and load the configurations that match labels `plugin: <plugin-name>`.

**Example:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: example-pod-monitor
  labels:
    plugin: <metadata.name>
    ## e.g plugin: kube-monitoring
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
