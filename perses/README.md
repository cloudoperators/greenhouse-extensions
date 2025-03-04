---
title: Perses
---

> [!WARNING]
> This plugin is in beta and please report any bugs by creating an issue [here](https://github.com/cloudoperators/greenhouse-extensions/issues/new/choose).

## Table of Contents
- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Disclaimer](#disclaimer)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Create a custom dashboard](#create-a-custom-dashboard)
- [Add Dashboards as ConfigMaps](#add-dashboards-as-configmaps)
    - [Recommended folder structure](#recommended-folder-structure)

Learn more about the **Perses** Plugin. Use it to visualize Prometheus/Thanos metrics for your Greenhouse remote cluster.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

Observability is often required for the operation and automation of service offerings. [Perses](https://perses.dev/) is a CNCF project and it aims to become an open-standard for dashboards and visualization. It provides you with tools to display Prometheus metrics on live dashboards with insightful charts and visualizations. In the Greenhouse context, this complements the **kube-monitoring** plugin, which automatically acts as a Perses data source which is recognized by Perses. In addition, the Plugin provides a mechanism that automates the lifecycle of datasources and dashboards without having to restart Perses.

![Perses Architecture](img/perses-arch.png)

## Disclaimer

This is not meant to be a comprehensive package that covers all scenarios. If you are an expert, feel free to configure the Plugin according to your needs.

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick Start

This guide provides a quick and straightforward way how to use Perses as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-managed Kubernetes remote cluster
- `kube-monitoring` Plugin should be installed with `.spec.kubeMonitoring.prometheus.persesDatasource: true` and it should have at least one Prometheus instance running in the cluster

The plugin works by default with anonymous access enabled. This plugin comes with some default dashboards and the kube-monitoring datasource will be automatically discovered by the plugin.

**Step 1: Add your dashboards and datasources**

Dashboards are selected from `ConfigMaps` across namespaces. The plugin searches for `ConfigMaps` with the label `perses.dev/resource: "true"` and imports them into Perses. The `ConfigMap` must contain a key like `my-dashboard.json` with the dashboard JSON content. Please [refer this section](#add-dashboards-as-configmaps) for more information.

A guide on how to create custom dashboards on the UI can be found [here](#create-a-custom-dashboard).

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.commonLabels | object | `{}` |  |
| greenhouse.defaultDashboards.enabled | bool | `true` |  |
| perses.additionalLabels | object | `{}` |  |
| perses.annotations | object | `{}` | Statefulset Annotations |
| perses.config | object | `{"annotations":{},"api_prefix":"/perses","database":{"file":{"extension":"json","folder":"/perses"}},"frontend":{"important_dashboards":[]},"provisioning":{"folders":["/etc/perses/provisioning"],"interval":"10s"},"schemas":{"datasources_path":"/etc/perses/cue/schemas/datasources","interval":"5m","panels_path":"/etc/perses/cue/schemas/panels","queries_path":"/etc/perses/cue/schemas/queries","variables_path":"/etc/perses/cue/schemas/variables"},"security":{"cookie":{"same_site":"lax","secure":false},"enable_auth":false,"readonly":false}}` | Perses configuration file ref: https://github.com/perses/perses/blob/main/docs/user-guides/configuration.md |
| perses.config.annotations | object | `{}` | Annotations for config |
| perses.config.database | object | `{"file":{"extension":"json","folder":"/perses"}}` | Database config based on data base type |
| perses.config.database.file | object | `{"extension":"json","folder":"/perses"}` | file system configs |
| perses.config.frontend | object | `{"important_dashboards":[]}` | Important dashboards list |
| perses.config.provisioning | object | `{"folders":["/etc/perses/provisioning"],"interval":"10s"}` | provisioning config |
| perses.config.schemas | object | `{"datasources_path":"/etc/perses/cue/schemas/datasources","interval":"5m","panels_path":"/etc/perses/cue/schemas/panels","queries_path":"/etc/perses/cue/schemas/queries","variables_path":"/etc/perses/cue/schemas/variables"}` | Schemas paths |
| perses.config.security.cookie | object | `{"same_site":"lax","secure":false}` | cookie config |
| perses.config.security.enable_auth | bool | `false` | Enable Authentication |
| perses.config.security.readonly | bool | `false` | Configure Perses instance as readonly |
| perses.datasources | list | `[]` | Configure datasources DEPRECATED: This field will be removed in the future release. Please use the 'sidecar' configuration to provision datasources. ref: https://github.com/perses/perses/blob/90beed356243208f14cf2249bebb6f6222cb77ae/docs/datasource.md |
| perses.fullnameOverride | string | `""` | Override fully qualified app name |
| perses.image.name | string | `"persesdev/perses"` | Perses image repository and name |
| perses.image.pullPolicy | string | `"IfNotPresent"` | Default image pull policy |
| perses.image.version | string | `""` | Overrides the image tag whose default is the chart appVersion. |
| perses.ingress | object | `{"annotations":{},"enabled":false,"hosts":[{"host":"perses.local","paths":[{"path":"/","pathType":"Prefix"}]}],"ingressClassName":"","tls":[]}` | Configure the ingress resource that allows you to access Thanos Query Frontend ref: https://kubernetes.io/docs/concepts/services-networking/ingress/ |
| perses.ingress.annotations | object | `{}` | Additional annotations for the Ingress resource. To enable certificate autogeneration, place here your cert-manager annotations. For a full list of possible ingress annotations, please see ref: https://github.com/kubernetes/ingress-nginx/blob/master/docs/user-guide/nginx-configuration/annotations.md |
| perses.ingress.enabled | bool | `false` | Enable ingress controller resource |
| perses.ingress.hosts | list | `[{"host":"perses.local","paths":[{"path":"/","pathType":"Prefix"}]}]` | Default host for the ingress resource |
| perses.ingress.ingressClassName | string | `""` | IngressClass that will be be used to implement the Ingress (Kubernetes 1.18+) This is supported in Kubernetes 1.18+ and required if you have more than one IngressClass marked as the default for your cluster . ref: https://kubernetes.io/blog/2020/04/02/improvements-to-the-ingress-api-in-kubernetes-1.18/  |
| perses.ingress.tls | list | `[]` | Ingress TLS configuration |
| perses.livenessProbe | object | `{"enabled":true,"failureThreshold":5,"initialDelaySeconds":10,"periodSeconds":60,"successThreshold":1,"timeoutSeconds":5}` | Liveness probe configuration Ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/ |
| perses.logLevel | string | `"info"` | Log level for Perses be configured in available options "panic", "error", "warning", "info", "debug", "trace" |
| perses.nameOverride | string | `""` | Override name of the chart used in Kubernetes object names. |
| perses.persistence | object | `{"accessModes":["ReadWriteOnce"],"annotations":{},"enabled":false,"labels":{},"securityContext":{"fsGroup":2000},"size":"8Gi"}` | Persistence parameters |
| perses.persistence.accessModes | list | `["ReadWriteOnce"]` | PVC Access Modes for data volume |
| perses.persistence.annotations | object | `{}` | Annotations for the PVC |
| perses.persistence.enabled | bool | `false` | If disabled, it will use a emptydir volume |
| perses.persistence.labels | object | `{}` | Labels for the PVC |
| perses.persistence.securityContext | object | `{"fsGroup":2000}` | Security context for the PVC when persistence is enabled |
| perses.persistence.size | string | `"8Gi"` | PVC Storage Request for data volume |
| perses.readinessProbe | object | `{"enabled":true,"failureThreshold":5,"initialDelaySeconds":5,"periodSeconds":10,"successThreshold":1,"timeoutSeconds":5}` | Readiness probe configuration Ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/ |
| perses.replicas | int | `1` | Number of pod replicas. |
| perses.resources | object | `{}` | Resource limits & requests. Update according to your own use case as these values might be too low for a typical deployment. ref: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| perses.service | object | `{"annotations":{},"labels":{"greenhouse.sap/expose":"true"},"port":8080,"portName":"http","targetPort":8080,"type":"ClusterIP"}` | Expose the Perses service to be accessed from outside the cluster (LoadBalancer service). or access it from within the cluster (ClusterIP service). Set the service type and the port to serve it. |
| perses.service.annotations | object | `{}` | Annotations to add to the service |
| perses.service.labels | object | `{"greenhouse.sap/expose":"true"}` | Labeles to add to the service |
| perses.service.port | int | `8080` | Service Port |
| perses.service.portName | string | `"http"` | Service Port Name |
| perses.service.targetPort | int | `8080` | Perses running port |
| perses.service.type | string | `"ClusterIP"` | Service Type |
| perses.serviceAccount | object | `{"annotations":{},"create":true,"name":""}` | Service account for Perses to use. |
| perses.serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| perses.serviceAccount.create | bool | `true` | Specifies whether a service account should be created |
| perses.serviceAccount.name | string | `""` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |
| perses.sidecar | object | `{"enabled":true,"image":{"repository":"kiwigrid/k8s-sidecar","tag":"1.30.1"},"label":"perses.dev/resource","labelValue":"true"}` | Sidecar configuration that watches for ConfigMaps with the specified label/labelValue and loads them into Perses provisioning |
| perses.sidecar.enabled | bool | `true` | Enable the sidecar container for ConfigMap provisioning |
| perses.sidecar.image.repository | string | `"kiwigrid/k8s-sidecar"` | Container image repository for the sidecar |
| perses.sidecar.image.tag | string | `"1.30.1"` | Container image tag for the sidecar |
| perses.sidecar.label | string | `"perses.dev/resource"` | Label key to watch for ConfigMaps containing Perses resources |
| perses.sidecar.labelValue | string | `"true"` | Label value to watch for ConfigMaps containing Perses resources |
| perses.testFramework.enabled | bool | `true` |  |
| perses.testFramework.image.registry | string | `"ghcr.io"` |  |
| perses.testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` |  |
| perses.testFramework.image.tag | string | `"main"` |  |
| perses.testFramework.imagePullPolicy | string | `"IfNotPresent"` |  |
| perses.volumeMounts | list | `[]` | Additional VolumeMounts on the output StatefulSet definition. |
| perses.volumes | list | `[]` | Additional volumes on the output StatefulSet definition. |
| testKey | string | `"testValue"` |  |