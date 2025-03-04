---
title: Plutono
---

Learn more about the **plutono** Plugin. Use it to install the web dashboarding system [Plutono](https://github.com/credativ/plutono) to collect, correlate, and visualize Prometheus metrics for your Greenhouse cluster.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

Observability is often required for the operation and automation of service offerings. Plutono provides you with tools to display Prometheus metrics on live dashboards with insightful charts and visualizations. In the Greenhouse context, this complements the **kube-monitoring** plugin, which automatically acts as a Plutono data source which is recognized by Plutono. In addition, the Plugin provides a mechanism that automates the lifecycle of datasources and dashboards without having to restart Plutono.

![Plutono Architecture](img/Plutono-arch.png)

## Disclaimer

This is not meant to be a comprehensive package that covers all scenarios. If you are an expert, feel free to configure the Plugin according to your needs.

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick Start

This guide provides a quick and straightforward way how to use Plutono as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-managed Kubernetes cluster
- `kube-monitoring` Plugin installed to have at least one Prometheus instance running in the cluster

The plugin works by default with anonymous access enabled. If you use the standard configuration in the **kube-monitoring** plugin, the data source and some [kubernetes-operations](https://github.com/cloudoperators/kubernetes-operations) dashboards are already pre-installed.

**Step 1: Add your dashboards**

Dashboards are selected from `ConfigMaps` across namespaces. The plugin searches for `ConfigMaps` with the label `plutono-dashboard: "true"` and imports them into Plutono. The `ConfigMap` must contain a key like `my-dashboard.json` with the dashboard JSON content. [Example](https://github.com/cloudoperators/greenhouse-extensions/blob/main/plutono/README.md#example-dashboard-config)

A guide on how to create dashboards can be found [here](https://github.com/cloudoperators/greenhouse-extensions/blob/main/plutono/README.md#create-a-dashboard).

**Step 2: Add your datasources**

Data sources are selected from `Secrets` across namespaces. The plugin searches for `Secrets` with the label `plutono-dashboard: "true"` and imports them into Plutono. The `Secrets` should contain valid datasource configuration YAML. [Example](https://github.com/cloudoperators/greenhouse-extensions/blob/main/plutono/README.md#example-datasource-config)

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.imagePullSecrets | list | `[]` |  |
| global.imageRegistry | string | `nil` | Overrides the Docker registry globally for all images |
| plutono."plutono.ini"."auth.anonymous".enabled | bool | `true` |  |
| plutono."plutono.ini"."auth.anonymous".org_role | string | `"Admin"` |  |
| plutono."plutono.ini".auth.disable_login_form | bool | `true` |  |
| plutono."plutono.ini".log.mode | string | `"console"` |  |
| plutono."plutono.ini".paths.data | string | `"/var/lib/plutono/"` |  |
| plutono."plutono.ini".paths.logs | string | `"/var/log/plutono"` |  |
| plutono."plutono.ini".paths.plugins | string | `"/var/lib/plutono/plugins"` |  |
| plutono."plutono.ini".paths.provisioning | string | `"/etc/plutono/provisioning"` |  |
| plutono.admin.existingSecret | string | `""` |  |
| plutono.admin.passwordKey | string | `"admin-password"` |  |
| plutono.admin.userKey | string | `"admin-user"` |  |
| plutono.adminPassword | string | `"strongpassword"` |  |
| plutono.adminUser | string | `"admin"` |  |
| plutono.affinity | object | `{}` |  |
| plutono.alerting | object | `{}` |  |
| plutono.assertNoLeakedSecrets | bool | `true` |  |
| plutono.automountServiceAccountToken | bool | `true` |  |
| plutono.autoscaling.behavior | object | `{}` |  |
| plutono.autoscaling.enabled | bool | `false` |  |
| plutono.autoscaling.maxReplicas | int | `5` |  |
| plutono.autoscaling.minReplicas | int | `1` |  |
| plutono.autoscaling.targetCPU | string | `"60"` |  |
| plutono.autoscaling.targetMemory | string | `""` |  |
| plutono.containerSecurityContext.allowPrivilegeEscalation | bool | `false` |  |
| plutono.containerSecurityContext.capabilities.drop[0] | string | `"ALL"` |  |
| plutono.containerSecurityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| plutono.createConfigmap | bool | `true` |  |
| plutono.dashboardProviders | object | `{}` |  |
| plutono.dashboards | object | `{}` |  |
| plutono.dashboardsConfigMaps | object | `{}` |  |
| plutono.datasources | object | `{}` |  |
| plutono.deploymentStrategy.type | string | `"RollingUpdate"` |  |
| plutono.dnsConfig | object | `{}` |  |
| plutono.dnsPolicy | string | `nil` |  |
| plutono.downloadDashboards.env | object | `{}` |  |
| plutono.downloadDashboards.envFromSecret | string | `""` |  |
| plutono.downloadDashboards.envValueFrom | object | `{}` |  |
| plutono.downloadDashboards.resources | object | `{}` |  |
| plutono.downloadDashboards.securityContext.allowPrivilegeEscalation | bool | `false` |  |
| plutono.downloadDashboards.securityContext.capabilities.drop[0] | string | `"ALL"` |  |
| plutono.downloadDashboards.securityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| plutono.downloadDashboardsImage.pullPolicy | string | `"IfNotPresent"` |  |
| plutono.downloadDashboardsImage.registry | string | `"docker.io"` | The Docker registry |
| plutono.downloadDashboardsImage.repository | string | `"curlimages/curl"` |  |
| plutono.downloadDashboardsImage.sha | string | `""` |  |
| plutono.downloadDashboardsImage.tag | string | `"8.12.1"` |  |
| plutono.enableKubeBackwardCompatibility | bool | `false` |  |
| plutono.enableServiceLinks | bool | `true` |  |
| plutono.env | object | `{}` |  |
| plutono.envFromConfigMaps | list | `[]` |  |
| plutono.envFromSecret | string | `""` |  |
| plutono.envFromSecrets | list | `[]` |  |
| plutono.envRenderSecret | object | `{}` |  |
| plutono.envValueFrom | object | `{}` |  |
| plutono.extraConfigmapMounts | list | `[]` |  |
| plutono.extraContainerVolumes | list | `[]` |  |
| plutono.extraContainers | string | `""` |  |
| plutono.extraEmptyDirMounts | list | `[]` |  |
| plutono.extraExposePorts | list | `[]` |  |
| plutono.extraInitContainers | list | `[]` |  |
| plutono.extraLabels.plugin | string | `"plutono"` |  |
| plutono.extraObjects | list | `[]` |  |
| plutono.extraSecretMounts | list | `[]` |  |
| plutono.extraVolumeMounts | list | `[]` |  |
| plutono.extraVolumes | list | `[]` |  |
| plutono.gossipPortName | string | `"gossip"` |  |
| plutono.headlessService | bool | `false` |  |
| plutono.hostAliases | list | `[]` |  |
| plutono.image.pullPolicy | string | `"IfNotPresent"` |  |
| plutono.image.pullSecrets | list | `[]` |  |
| plutono.image.registry | string | `"ghcr.io"` |  |
| plutono.image.repository | string | `"credativ/plutono"` |  |
| plutono.image.sha | string | `""` |  |
| plutono.image.tag | string | `"v7.5.36"` |  |
| plutono.ingress.annotations | object | `{}` |  |
| plutono.ingress.enabled | bool | `false` |  |
| plutono.ingress.extraPaths | list | `[]` |  |
| plutono.ingress.hosts[0] | string | `"chart-example.local"` |  |
| plutono.ingress.labels | object | `{}` |  |
| plutono.ingress.path | string | `"/"` |  |
| plutono.ingress.pathType | string | `"Prefix"` |  |
| plutono.ingress.tls | list | `[]` |  |
| plutono.initChownData.enabled | bool | `true` |  |
| plutono.initChownData.image.pullPolicy | string | `"IfNotPresent"` |  |
| plutono.initChownData.image.registry | string | `"docker.io"` | The Docker registry |
| plutono.initChownData.image.repository | string | `"library/busybox"` |  |
| plutono.initChownData.image.sha | string | `""` |  |
| plutono.initChownData.image.tag | string | `"1.37.0"` |  |
| plutono.initChownData.resources | object | `{}` |  |
| plutono.initChownData.securityContext.capabilities.add[0] | string | `"CHOWN"` |  |
| plutono.initChownData.securityContext.runAsNonRoot | bool | `false` |  |
| plutono.initChownData.securityContext.runAsUser | int | `0` |  |
| plutono.initChownData.securityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| plutono.ldap.config | string | `""` |  |
| plutono.ldap.enabled | bool | `false` |  |
| plutono.ldap.existingSecret | string | `""` |  |
| plutono.lifecycleHooks | object | `{}` |  |
| plutono.livenessProbe.failureThreshold | int | `10` |  |
| plutono.livenessProbe.httpGet.path | string | `"/api/health"` |  |
| plutono.livenessProbe.httpGet.port | int | `3000` |  |
| plutono.livenessProbe.initialDelaySeconds | int | `60` |  |
| plutono.livenessProbe.timeoutSeconds | int | `30` |  |
| plutono.namespaceOverride | string | `""` |  |
| plutono.networkPolicy.allowExternal | bool | `true` |  |
| plutono.networkPolicy.egress.blockDNSResolution | bool | `false` |  |
| plutono.networkPolicy.egress.enabled | bool | `false` |  |
| plutono.networkPolicy.egress.ports | list | `[]` |  |
| plutono.networkPolicy.egress.to | list | `[]` |  |
| plutono.networkPolicy.enabled | bool | `false` |  |
| plutono.networkPolicy.explicitNamespacesSelector | object | `{}` |  |
| plutono.networkPolicy.ingress | bool | `true` |  |
| plutono.nodeSelector | object | `{}` |  |
| plutono.persistence.accessModes[0] | string | `"ReadWriteOnce"` |  |
| plutono.persistence.disableWarning | bool | `false` |  |
| plutono.persistence.enabled | bool | `false` |  |
| plutono.persistence.extraPvcLabels | object | `{}` |  |
| plutono.persistence.finalizers[0] | string | `"kubernetes.io/pvc-protection"` |  |
| plutono.persistence.inMemory.enabled | bool | `false` |  |
| plutono.persistence.lookupVolumeName | bool | `true` |  |
| plutono.persistence.size | string | `"10Gi"` |  |
| plutono.persistence.type | string | `"pvc"` |  |
| plutono.plugins | list | `[]` |  |
| plutono.podDisruptionBudget | object | `{}` |  |
| plutono.podPortName | string | `"plutono"` |  |
| plutono.rbac.create | bool | `true` |  |
| plutono.rbac.extraClusterRoleRules | list | `[]` |  |
| plutono.rbac.extraRoleRules | list | `[]` |  |
| plutono.rbac.namespaced | bool | `false` |  |
| plutono.rbac.pspEnabled | bool | `false` |  |
| plutono.rbac.pspUseAppArmor | bool | `false` |  |
| plutono.readinessProbe.httpGet.path | string | `"/api/health"` |  |
| plutono.readinessProbe.httpGet.port | int | `3000` |  |
| plutono.replicas | int | `1` |  |
| plutono.resources | object | `{}` |  |
| plutono.revisionHistoryLimit | int | `10` |  |
| plutono.securityContext.fsGroup | int | `472` |  |
| plutono.securityContext.runAsGroup | int | `472` |  |
| plutono.securityContext.runAsNonRoot | bool | `true` |  |
| plutono.securityContext.runAsUser | int | `472` |  |
| plutono.service.annotations | object | `{}` |  |
| plutono.service.appProtocol | string | `""` |  |
| plutono.service.enabled | bool | `true` |  |
| plutono.service.ipFamilies | list | `[]` |  |
| plutono.service.ipFamilyPolicy | string | `""` |  |
| plutono.service.labels."greenhouse.sap/expose" | string | `"true"` |  |
| plutono.service.loadBalancerClass | string | `""` |  |
| plutono.service.loadBalancerIP | string | `""` |  |
| plutono.service.loadBalancerSourceRanges | list | `[]` |  |
| plutono.service.port | int | `80` |  |
| plutono.service.portName | string | `"service"` |  |
| plutono.service.targetPort | int | `3000` |  |
| plutono.service.type | string | `"ClusterIP"` |  |
| plutono.serviceAccount.automountServiceAccountToken | bool | `false` |  |
| plutono.serviceAccount.create | bool | `true` |  |
| plutono.serviceAccount.labels | object | `{}` |  |
| plutono.serviceAccount.name | string | `nil` |  |
| plutono.serviceAccount.nameTest | string | `nil` |  |
| plutono.serviceMonitor.enabled | bool | `false` |  |
| plutono.serviceMonitor.interval | string | `"30s"` |  |
| plutono.serviceMonitor.labels | object | `{}` |  |
| plutono.serviceMonitor.metricRelabelings | list | `[]` |  |
| plutono.serviceMonitor.path | string | `"/metrics"` |  |
| plutono.serviceMonitor.relabelings | list | `[]` |  |
| plutono.serviceMonitor.scheme | string | `"http"` |  |
| plutono.serviceMonitor.scrapeTimeout | string | `"30s"` |  |
| plutono.serviceMonitor.targetLabels | list | `[]` |  |
| plutono.serviceMonitor.tlsConfig | object | `{}` |  |
| plutono.sidecar.alerts.enabled | bool | `false` |  |
| plutono.sidecar.alerts.env | object | `{}` |  |
| plutono.sidecar.alerts.extraMounts | list | `[]` |  |
| plutono.sidecar.alerts.initAlerts | bool | `false` |  |
| plutono.sidecar.alerts.label | string | `"plutono_alert"` |  |
| plutono.sidecar.alerts.labelValue | string | `""` |  |
| plutono.sidecar.alerts.reloadURL | string | `"http://localhost:3000/api/admin/provisioning/alerting/reload"` |  |
| plutono.sidecar.alerts.resource | string | `"both"` |  |
| plutono.sidecar.alerts.script | string | `nil` |  |
| plutono.sidecar.alerts.searchNamespace | string | `nil` |  |
| plutono.sidecar.alerts.sizeLimit | object | `{}` |  |
| plutono.sidecar.alerts.skipReload | bool | `false` |  |
| plutono.sidecar.alerts.watchMethod | string | `"WATCH"` |  |
| plutono.sidecar.dashboards.SCProvider | bool | `true` |  |
| plutono.sidecar.dashboards.defaultFolderName | string | `nil` |  |
| plutono.sidecar.dashboards.enabled | bool | `true` |  |
| plutono.sidecar.dashboards.env | object | `{}` |  |
| plutono.sidecar.dashboards.envValueFrom | object | `{}` |  |
| plutono.sidecar.dashboards.extraMounts | list | `[]` |  |
| plutono.sidecar.dashboards.folder | string | `"/tmp/dashboards"` |  |
| plutono.sidecar.dashboards.folderAnnotation | string | `nil` |  |
| plutono.sidecar.dashboards.label | string | `"plutono-dashboard"` |  |
| plutono.sidecar.dashboards.labelValue | string | `"true"` |  |
| plutono.sidecar.dashboards.provider.allowUiUpdates | bool | `false` |  |
| plutono.sidecar.dashboards.provider.disableDelete | bool | `false` |  |
| plutono.sidecar.dashboards.provider.folder | string | `""` |  |
| plutono.sidecar.dashboards.provider.folderUid | string | `""` |  |
| plutono.sidecar.dashboards.provider.foldersFromFilesStructure | bool | `false` |  |
| plutono.sidecar.dashboards.provider.name | string | `"sidecarProvider"` |  |
| plutono.sidecar.dashboards.provider.orgid | int | `1` |  |
| plutono.sidecar.dashboards.provider.type | string | `"file"` |  |
| plutono.sidecar.dashboards.reloadURL | string | `"http://localhost:3000/api/admin/provisioning/dashboards/reload"` |  |
| plutono.sidecar.dashboards.resource | string | `"both"` |  |
| plutono.sidecar.dashboards.script | string | `nil` |  |
| plutono.sidecar.dashboards.searchNamespace | string | `"ALL"` |  |
| plutono.sidecar.dashboards.sizeLimit | object | `{}` |  |
| plutono.sidecar.dashboards.skipReload | bool | `false` |  |
| plutono.sidecar.dashboards.watchMethod | string | `"WATCH"` |  |
| plutono.sidecar.datasources.enabled | bool | `true` |  |
| plutono.sidecar.datasources.env | object | `{}` |  |
| plutono.sidecar.datasources.envValueFrom | object | `{}` |  |
| plutono.sidecar.datasources.initDatasources | bool | `false` |  |
| plutono.sidecar.datasources.label | string | `"plutono-datasource"` |  |
| plutono.sidecar.datasources.labelValue | string | `"true"` |  |
| plutono.sidecar.datasources.reloadURL | string | `"http://localhost:3000/api/admin/provisioning/datasources/reload"` |  |
| plutono.sidecar.datasources.resource | string | `"both"` |  |
| plutono.sidecar.datasources.script | string | `nil` |  |
| plutono.sidecar.datasources.searchNamespace | string | `"ALL"` |  |
| plutono.sidecar.datasources.sizeLimit | object | `{}` |  |
| plutono.sidecar.datasources.skipReload | bool | `false` |  |
| plutono.sidecar.datasources.watchMethod | string | `"WATCH"` |  |
| plutono.sidecar.enableUniqueFilenames | bool | `false` |  |
| plutono.sidecar.image.registry | string | `"quay.io"` | The Docker registry |
| plutono.sidecar.image.repository | string | `"kiwigrid/k8s-sidecar"` |  |
| plutono.sidecar.image.sha | string | `""` |  |
| plutono.sidecar.image.tag | string | `"1.30.1"` |  |
| plutono.sidecar.imagePullPolicy | string | `"IfNotPresent"` |  |
| plutono.sidecar.livenessProbe | object | `{}` |  |
| plutono.sidecar.notifiers.enabled | bool | `false` |  |
| plutono.sidecar.notifiers.env | object | `{}` |  |
| plutono.sidecar.notifiers.initNotifiers | bool | `false` |  |
| plutono.sidecar.notifiers.label | string | `"plutono_notifier"` |  |
| plutono.sidecar.notifiers.labelValue | string | `""` |  |
| plutono.sidecar.notifiers.reloadURL | string | `"http://localhost:3000/api/admin/provisioning/notifications/reload"` |  |
| plutono.sidecar.notifiers.resource | string | `"both"` |  |
| plutono.sidecar.notifiers.script | string | `nil` |  |
| plutono.sidecar.notifiers.searchNamespace | string | `nil` |  |
| plutono.sidecar.notifiers.sizeLimit | object | `{}` |  |
| plutono.sidecar.notifiers.skipReload | bool | `false` |  |
| plutono.sidecar.notifiers.watchMethod | string | `"WATCH"` |  |
| plutono.sidecar.plugins.enabled | bool | `false` |  |
| plutono.sidecar.plugins.env | object | `{}` |  |
| plutono.sidecar.plugins.initPlugins | bool | `false` |  |
| plutono.sidecar.plugins.label | string | `"plutono_plugin"` |  |
| plutono.sidecar.plugins.labelValue | string | `""` |  |
| plutono.sidecar.plugins.reloadURL | string | `"http://localhost:3000/api/admin/provisioning/plugins/reload"` |  |
| plutono.sidecar.plugins.resource | string | `"both"` |  |
| plutono.sidecar.plugins.script | string | `nil` |  |
| plutono.sidecar.plugins.searchNamespace | string | `nil` |  |
| plutono.sidecar.plugins.sizeLimit | object | `{}` |  |
| plutono.sidecar.plugins.skipReload | bool | `false` |  |
| plutono.sidecar.plugins.watchMethod | string | `"WATCH"` |  |
| plutono.sidecar.readinessProbe | object | `{}` |  |
| plutono.sidecar.resources | object | `{}` |  |
| plutono.sidecar.securityContext.allowPrivilegeEscalation | bool | `false` |  |
| plutono.sidecar.securityContext.capabilities.drop[0] | string | `"ALL"` |  |
| plutono.sidecar.securityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| plutono.smtp.existingSecret | string | `""` |  |
| plutono.smtp.passwordKey | string | `"password"` |  |
| plutono.smtp.userKey | string | `"user"` |  |
| plutono.testFramework.enabled | bool | `true` |  |
| plutono.testFramework.image.registry | string | `"ghcr.io"` |  |
| plutono.testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` |  |
| plutono.testFramework.image.tag | string | `"main"` |  |
| plutono.testFramework.imagePullPolicy | string | `"IfNotPresent"` |  |
| plutono.testFramework.resources | object | `{}` |  |
| plutono.testFramework.securityContext | object | `{}` |  |
| plutono.tolerations | list | `[]` |  |
| plutono.topologySpreadConstraints | list | `[]` |  |
| plutono.useStatefulSet | bool | `false` |  |
| testKey | string | `"testValue"` |  |