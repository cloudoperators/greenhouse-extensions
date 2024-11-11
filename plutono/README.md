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

## Configuration


| Parameter                                 | Description                                   | Default                                                 |
|-------------------------------------------|-----------------------------------------------|---------------------------------------------------------|
| `plutono.replicas`                                | Number of nodes                               | `1`                                                     |
| `plutono.deploymentStrategy`                      | Deployment strategy                           | `{ "type": "RollingUpdate" }`                           |
| `plutono.livenessProbe`                           | Liveness Probe settings                       | `{ "httpGet": { "path": "/api/health", "port": 3000 } "initialDelaySeconds": 60, "timeoutSeconds": 30, "failureThreshold": 10 }` |
| `plutono.readinessProbe`                          | Readiness Probe settings                      | `{ "httpGet": { "path": "/api/health", "port": 3000 } }`|
| `plutono.securityContext`                         | Deployment securityContext                    | `{"runAsUser": 472, "runAsGroup": 472, "fsGroup": 472}`  |
| `plutono.priorityClassName`                       | Name of Priority Class to assign pods         | `nil`                                                   |
| `plutono.image.registry`                          | Image registry                                | `ghcr.io`                                       |
| `plutono.image.repository`                        | Image repository                              | `credativ/plutono`                                       |
| `plutono.image.tag`                               | Overrides the Plutono image tag whose default is the chart appVersion (`Must be >= 5.0.0`) | ``                                                      |
| `plutono.image.sha`                               | Image sha (optional)                          | ``                                                      |
| `plutono.image.pullPolicy`                        | Image pull policy                             | `IfNotPresent`                                          |
| `plutono.image.pullSecrets`                       | Image pull secrets (can be templated)         | `[]`                                                    |
| `plutono.service.enabled`                         | Enable plutono service                        | `true`                                                  |
| `plutono.service.ipFamilies`                      | Kubernetes service IP families                | `[]`                                                    |
| `plutono.service.ipFamilyPolicy`                  | Kubernetes service IP family policy           | `""`                                                    |
| `plutono.service.type`                            | Kubernetes service type                       | `ClusterIP`                                             |
| `plutono.service.port`                            | Kubernetes port where service is exposed      | `80`                                                    |
| `plutono.service.portName`                        | Name of the port on the service               | `service`                                               |
| `plutono.service.appProtocol`                     | Adds the appProtocol field to the service     | ``                                                      |
| `plutono.service.targetPort`                      | Internal service is port                      | `3000`                                                  |
| `plutono.service.nodePort`                        | Kubernetes service nodePort                   | `nil`                                                   |
| `plutono.service.annotations`                     | Service annotations (can be templated)        | `{}`                                                    |
| `plutono.service.labels`                          | Custom labels                                 | `{}`                                                    |
| `plutono.service.clusterIP`                       | internal cluster service IP                   | `nil`                                                   |
| `plutono.service.loadBalancerIP`                  | IP address to assign to load balancer (if supported) | `nil`                                            |
| `plutono.service.loadBalancerSourceRanges`        | list of IP CIDRs allowed access to lb (if supported) | `[]`                                             |
| `plutono.service.externalIPs`                     | service external IP addresses                 | `[]`                                                    |
| `plutono.service.externalTrafficPolicy`           | change the default externalTrafficPolicy | `nil`                                            |
| `plutono.headlessService`                         | Create a headless service                     | `false`                                                 |
| `plutono.extraExposePorts`                        | Additional service ports for sidecar containers| `[]`                                                   |
| `plutono.hostAliases`                             | adds rules to the pod's /etc/hosts            | `[]`                                                    |
| `plutono.ingress.enabled`                         | Enables Ingress                               | `false`                                                 |
| `plutono.ingress.annotations`                     | Ingress annotations (values are templated)    | `{}`                                                    |
| `plutono.ingress.labels`                          | Custom labels                                 | `{}`                                                    |
| `plutono.ingress.path`                            | Ingress accepted path                         | `/`                                                     |
| `plutono.ingress.pathType`                        | Ingress type of path                          | `Prefix`                                                |
| `plutono.ingress.hosts`                           | Ingress accepted hostnames                    | `["chart-example.local"]`                                                    |
| `plutono.ingress.extraPaths`                      | Ingress extra paths to prepend to every host configuration. Useful when configuring [custom actions with AWS ALB Ingress Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.6/guide/ingress/annotations/#actions). Requires `ingress.hosts` to have one or more host entries. | `[]`                                                    |
| `plutono.ingress.tls`                             | Ingress TLS configuration                     | `[]`                                                    |
| `plutono.ingress.ingressClassName`                | Ingress Class Name. MAY be required for Kubernetes versions >= 1.18 | `""`                              |
| `plutono.resources`                               | CPU/Memory resource requests/limits           | `{}`                                                    |
| `plutono.nodeSelector`                            | Node labels for pod assignment                | `{}`                                                    |
| `plutono.tolerations`                             | Toleration labels for pod assignment          | `[]`                                                    |
| `plutono.affinity`                                | Affinity settings for pod assignment          | `{}`                                                    |
| `plutono.extraInitContainers`                     | Init containers to add to the plutono pod     | `{}`                                                    |
| `plutono.extraContainers`                         | Sidecar containers to add to the plutono pod  | `""`                                                    |
| `plutono.extraContainerVolumes`                   | Volumes that can be mounted in sidecar containers | `[]`                                                |
| `plutono.extraLabels`                             | Custom labels for all manifests               | `{}`                                                    |
| `plutono.schedulerName`                           | Name of the k8s scheduler (other than default) | `nil`                                                  |
| `plutono.persistence.enabled`                     | Use persistent volume to store data           | `false`                                                 |
| `plutono.persistence.type`                        | Type of persistence (`pvc` or `statefulset`)  | `pvc`                                                   |
| `plutono.persistence.size`                        | Size of persistent volume claim               | `10Gi`                                                  |
| `plutono.persistence.existingClaim`               | Use an existing PVC to persist data (can be templated) | `nil`                                          |
| `plutono.persistence.storageClassName`            | Type of persistent volume claim               | `nil`                                                   |
| `plutono.persistence.accessModes`                 | Persistence access modes                      | `[ReadWriteOnce]`                                       |
| `plutono.persistence.annotations`                 | PersistentVolumeClaim annotations             | `{}`                                                    |
| `plutono.persistence.finalizers`                  | PersistentVolumeClaim finalizers              | `[ "kubernetes.io/pvc-protection" ]`                    |
| `plutono.persistence.extraPvcLabels`              | Extra labels to apply to a PVC.               | `{}`                                                    |
| `plutono.persistence.subPath`                     | Mount a sub dir of the persistent volume (can be templated) | `nil`                                     |
| `plutono.persistence.inMemory.enabled`            | If persistence is not enabled, whether to mount the local storage in-memory to improve performance | `false`                                                   |
| `plutono.persistence.inMemory.sizeLimit`          | SizeLimit for the in-memory local storage     | `nil`                                                   |
| `plutono.persistence.disableWarning`              | Hide NOTES warning, useful when persiting to a database | `false`                                       |
| `plutono.initChownData.enabled`                   | If false, don't reset data ownership at startup | true                                                  |
| `plutono.initChownData.image.registry`            | init-chown-data container image registry      | `docker.io`                                               |
| `plutono.initChownData.image.repository`          | init-chown-data container image repository    | `busybox`                                               |
| `plutono.initChownData.image.tag`                 | init-chown-data container image tag           | `1.31.1`                                                |
| `plutono.initChownData.image.sha`                 | init-chown-data container image sha (optional)| `""`                                                    |
| `plutono.initChownData.image.pullPolicy`          | init-chown-data container image pull policy   | `IfNotPresent`                                          |
| `plutono.initChownData.resources`                 | init-chown-data pod resource requests & limits | `{}`                                                   |
| `plutono.schedulerName`                           | Alternate scheduler name                      | `nil`                                                   |
| `plutono.env`                                     | Extra environment variables passed to pods    | `{}`                                                    |
| `plutono.envValueFrom`                            | Environment variables from alternate sources. See the API docs on [EnvVarSource](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.17/#envvarsource-v1-core) for format details. Can be templated | `{}` |
| `plutono.envFromSecret`                           | Name of a Kubernetes secret (must be manually created in the same namespace) containing values to be added to the environment. Can be templated | `""` |
| `plutono.envFromSecrets`                          | List of Kubernetes secrets (must be manually created in the same namespace) containing values to be added to the environment. Can be templated | `[]` |
| `plutono.envFromConfigMaps`                       | List of Kubernetes ConfigMaps (must be manually created in the same namespace) containing values to be added to the environment. Can be templated | `[]` |
| `plutono.envRenderSecret`                         | Sensible environment variables passed to pods and stored as secret. (passed through [tpl](https://helm.sh/docs/howto/charts_tips_and_tricks/#using-the-tpl-function))   | `{}`                               |
| `plutono.enableServiceLinks`                      | Inject Kubernetes services as environment variables. | `true`                                           |
| `plutono.extraSecretMounts`                       | Additional plutono server secret mounts       | `[]`                                                    |
| `plutono.extraVolumeMounts`                       | Additional plutono server volume mounts       | `[]`                                                    |
| `plutono.extraVolumes`                            | Additional Plutono server volumes             | `[]`                                                    |
| `plutono.automountServiceAccountToken`            | Mounted the service account token on the plutono pod. Mandatory, if sidecars are enabled  | `true`      |
| `plutono.createConfigmap`                         | Enable creating the plutono configmap         | `true`                                                  |
| `plutono.extraConfigmapMounts`                    | Additional plutono server configMap volume mounts (values are templated) | `[]`                         |
| `plutono.extraEmptyDirMounts`                     | Additional plutono server emptyDir volume mounts | `[]`                                                 |
| `plutono.plugins`                                 | Plugins to be loaded along with Plutono       | `[]`                                                    |
| `plutono.datasources`                             | Configure plutono datasources (passed through tpl) | `{}`                                               |
| `plutono.alerting`                                | Configure plutono alerting (passed through tpl) | `{}`                                                  |
| `plutono.notifiers`                               | Configure plutono notifiers                   | `{}`                                                    |
| `plutono.dashboardProviders`                      | Configure plutono dashboard providers         | `{}`                                                    |
| `plutono.dashboards`                              | Dashboards to import                          | `{}`                                                    |
| `plutono.dashboardsConfigMaps`                    | ConfigMaps reference that contains dashboards | `{}`                                                    |
| `plutono.plutono.ini`                             | Plutono's primary configuration               | `{}`                                                    |
| `global.imageRegistry`                    | Global image pull registry for all images.    | `null`                                   |
| `global.imagePullSecrets`                 | Global image pull secrets (can be templated). Allows either an array of {name: pullSecret} maps (k8s-style), or an array of strings (more common helm-style).  | `[]`                                                    |
| `plutono.ldap.enabled`                            | Enable LDAP authentication                    | `false`                                                 |
| `plutono.ldap.existingSecret`                     | The name of an existing secret containing the `ldap.toml` file, this must have the key `ldap-toml`. | `""` |
| `plutono.ldap.config`                             | Plutono's LDAP configuration                  | `""`                                                    |
| `plutono.annotations`                             | Deployment annotations                        | `{}`                                                    |
| `plutono.labels`                                  | Deployment labels                             | `{}`                                                    |
| `plutono.podAnnotations`                          | Pod annotations                               | `{}`                                                    |
| `plutono.podLabels`                               | Pod labels                                    | `{}`                                                    |
| `plutono.podPortName`                             | Name of the plutono port on the pod           | `plutono`                                               |
| `plutono.lifecycleHooks`                          | Lifecycle hooks for podStart and preStop [Example](https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/#define-poststart-and-prestop-handlers)     | `{}`                                                    |
| `plutono.sidecar.image.registry`                  | Sidecar image registry                        | `quay.io`                          |
| `plutono.sidecar.image.repository`                | Sidecar image repository                      | `kiwigrid/k8s-sidecar`                          |
| `plutono.sidecar.image.tag`                       | Sidecar image tag                             | `1.26.0`                                                |
| `plutono.sidecar.image.sha`                       | Sidecar image sha (optional)                  | `""`                                                    |
| `plutono.sidecar.imagePullPolicy`                 | Sidecar image pull policy                     | `IfNotPresent`                                          |
| `plutono.sidecar.resources`                       | Sidecar resources                             | `{}`                                                    |
| `plutono.sidecar.securityContext`                 | Sidecar securityContext                       | `{}`                                                    |
| `plutono.sidecar.enableUniqueFilenames`           | Sets the kiwigrid/k8s-sidecar UNIQUE_FILENAMES environment variable. If set to `true` the sidecar will create unique filenames where duplicate data keys exist between ConfigMaps and/or Secrets within the same or multiple Namespaces. | `false`                           |
| `plutono.sidecar.alerts.enabled`             | Enables the cluster wide search for alerts and adds/updates/deletes them in plutono |`false`       |
| `plutono.sidecar.alerts.label`               | Label that config maps with alerts should have to be added | `plutono_alert`                               |
| `plutono.sidecar.alerts.labelValue`          | Label value that config maps with alerts should have to be added | `""`                                |
| `plutono.sidecar.alerts.searchNamespace`     | Namespaces list. If specified, the sidecar will search for alerts config-maps  inside these namespaces. Otherwise the namespace in which the sidecar is running will be used. It's also possible to specify ALL to search in all namespaces. | `nil`                               |
| `plutono.sidecar.alerts.watchMethod`         | Method to use to detect ConfigMap changes. With WATCH the sidecar will do a WATCH requests, with SLEEP it will list all ConfigMaps, then sleep for 60 seconds. | `WATCH` |
| `plutono.sidecar.alerts.resource`            | Should the sidecar looks into secrets, configmaps or both. | `both`                               |
| `plutono.sidecar.alerts.reloadURL`           | Full url of datasource configuration reload API endpoint, to invoke after a config-map change | `"http://localhost:3000/api/admin/provisioning/alerting/reload"` |
| `plutono.sidecar.alerts.skipReload`          | Enabling this omits defining the REQ_URL and REQ_METHOD environment variables | `false` |
| `plutono.sidecar.alerts.initAlerts`          | Set to true to deploy the alerts sidecar as an initContainer. This is needed if skipReload is true, to load any alerts defined at startup time. | `false` |
| `plutono.sidecar.alerts.extraMounts`         | Additional alerts sidecar volume mounts. | `[]`                               |
| `plutono.sidecar.dashboards.enabled`              | Enables the cluster wide search for dashboards and adds/updates/deletes them in plutono | `false`       |
| `plutono.sidecar.dashboards.SCProvider`           | Enables creation of sidecar provider          | `true`                                                  |
| `plutono.sidecar.dashboards.provider.name`        | Unique name of the plutono provider           | `sidecarProvider`                                       |
| `plutono.sidecar.dashboards.provider.orgid`       | Id of the organisation, to which the dashboards should be added | `1`                                   |
| `plutono.sidecar.dashboards.provider.folder`      | Logical folder in which plutono groups dashboards | `""`                                                |
| `plutono.sidecar.dashboards.provider.folderUid`   | Allows you to specify the static UID for the logical folder above | `""`                                |
| `plutono.sidecar.dashboards.provider.disableDelete` | Activate to avoid the deletion of imported dashboards | `false`                                       |
| `plutono.sidecar.dashboards.provider.allowUiUpdates` | Allow updating provisioned dashboards from the UI | `false`                                          |
| `plutono.sidecar.dashboards.provider.type`        | Provider type                                 | `file`                                                  |
| `plutono.sidecar.dashboards.provider.foldersFromFilesStructure`        | Allow Plutono to replicate dashboard structure from filesystem.                                 | `false`                                                  |
| `plutono.sidecar.dashboards.watchMethod`          | Method to use to detect ConfigMap changes. With WATCH the sidecar will do a WATCH requests, with SLEEP it will list all ConfigMaps, then sleep for 60 seconds. | `WATCH` |
| `plutono.sidecar.skipTlsVerify`                   | Set to true to skip tls verification for kube api calls | `nil`                                         |
| `plutono.sidecar.dashboards.label`                | Label that config maps with dashboards should have to be added | `plutono_dashboard`                                |
| `plutono.sidecar.dashboards.labelValue`                | Label value that config maps with dashboards should have to be added | `""`                                |
| `plutono.sidecar.dashboards.folder`               | Folder in the pod that should hold the collected dashboards (unless `sidecar.dashboards.defaultFolderName` is set). This path will be mounted. | `/tmp/dashboards`    |
| `plutono.sidecar.dashboards.folderAnnotation`     | The annotation the sidecar will look for in configmaps to override the destination folder for files | `nil`                                                  |
| `plutono.sidecar.dashboards.defaultFolderName`    | The default folder name, it will create a subfolder under the `sidecar.dashboards.folder` and put dashboards in there instead | `nil`                                |
| `plutono.sidecar.dashboards.searchNamespace`      | Namespaces list. If specified, the sidecar will search for dashboards config-maps  inside these namespaces. Otherwise the namespace in which the sidecar is running will be used. It's also possible to specify ALL to search in all namespaces. | `nil`                                |
| `plutono.sidecar.dashboards.script`               | Absolute path to shell script to execute after a configmap got reloaded. | `nil`                                |
| `plutono.sidecar.dashboards.reloadURL`            | Full url of dashboards configuration reload API endpoint, to invoke after a config-map change | `"http://localhost:3000/api/admin/provisioning/dashboards/reload"` |
| `plutono.sidecar.dashboards.skipReload`           | Enabling this omits defining the REQ_USERNAME, REQ_PASSWORD, REQ_URL and REQ_METHOD environment variables | `false` |
| `plutono.sidecar.dashboards.resource`             | Should the sidecar looks into secrets, configmaps or both. | `both`                               |
| `plutono.sidecar.dashboards.extraMounts`          | Additional dashboard sidecar volume mounts. | `[]`                               |
| `plutono.sidecar.datasources.enabled`             | Enables the cluster wide search for datasources and adds/updates/deletes them in plutono |`false`       |
| `plutono.sidecar.datasources.label`               | Label that config maps with datasources should have to be added | `plutono_datasource`                               |
| `plutono.sidecar.datasources.labelValue`          | Label value that config maps with datasources should have to be added | `""`                                |
| `plutono.sidecar.datasources.searchNamespace`     | Namespaces list. If specified, the sidecar will search for datasources config-maps  inside these namespaces. Otherwise the namespace in which the sidecar is running will be used. It's also possible to specify ALL to search in all namespaces. | `nil`                               |
| `plutono.sidecar.datasources.watchMethod`         | Method to use to detect ConfigMap changes. With WATCH the sidecar will do a WATCH requests, with SLEEP it will list all ConfigMaps, then sleep for 60 seconds. | `WATCH` |
| `plutono.sidecar.datasources.resource`            | Should the sidecar looks into secrets, configmaps or both. | `both`                               |
| `plutono.sidecar.datasources.reloadURL`           | Full url of datasource configuration reload API endpoint, to invoke after a config-map change | `"http://localhost:3000/api/admin/provisioning/datasources/reload"` |
| `plutono.sidecar.datasources.skipReload`          | Enabling this omits defining the REQ_URL and REQ_METHOD environment variables | `false` |
| `plutono.sidecar.datasources.initDatasources`     | Set to true to deploy the datasource sidecar as an initContainer in addition to a container. This is needed if skipReload is true, to load any datasources defined at startup time. | `false` |
| `plutono.sidecar.notifiers.enabled`               | Enables the cluster wide search for notifiers and adds/updates/deletes them in plutono | `false`        |
| `plutono.sidecar.notifiers.label`                 | Label that config maps with notifiers should have to be added | `plutono_notifier`                               |
| `plutono.sidecar.notifiers.labelValue`            | Label value that config maps with notifiers should have to be added | `""`                                |
| `plutono.sidecar.notifiers.searchNamespace`       | Namespaces list. If specified, the sidecar will search for notifiers config-maps (or secrets) inside these namespaces. Otherwise the namespace in which the sidecar is running will be used. It's also possible to specify ALL to search in all namespaces. | `nil`                               |
| `plutono.sidecar.notifiers.watchMethod`           | Method to use to detect ConfigMap changes. With WATCH the sidecar will do a WATCH requests, with SLEEP it will list all ConfigMaps, then sleep for 60 seconds. | `WATCH` |
| `plutono.sidecar.notifiers.resource`              | Should the sidecar looks into secrets, configmaps or both. | `both`                               |
| `plutono.sidecar.notifiers.reloadURL`             | Full url of notifier configuration reload API endpoint, to invoke after a config-map change | `"http://localhost:3000/api/admin/provisioning/notifications/reload"` |
| `plutono.sidecar.notifiers.skipReload`            | Enabling this omits defining the REQ_URL and REQ_METHOD environment variables | `false` |
| `plutono.sidecar.notifiers.initNotifiers`         | Set to true to deploy the notifier sidecar as an initContainer in addition to a container. This is needed if skipReload is true, to load any notifiers defined at startup time. | `false` |
| `plutono.smtp.existingSecret`                     | The name of an existing secret containing the SMTP credentials. | `""`                                  |
| `plutono.smtp.userKey`                            | The key in the existing SMTP secret containing the username. | `"user"`                                 |
| `plutono.smtp.passwordKey`                        | The key in the existing SMTP secret containing the password. | `"password"`                             |
| `plutono.admin.existingSecret`                    | The name of an existing secret containing the admin credentials (can be templated). | `""`                                 |
| `plutono.admin.userKey`                           | The key in the existing admin secret containing the username. | `"admin-user"`                          |
| `plutono.admin.passwordKey`                       | The key in the existing admin secret containing the password. | `"admin-password"`                      |
| `plutono.serviceAccount.automountServiceAccountToken` | Automount the service account token on all pods where is service account is used | `false` |
| `plutono.serviceAccount.annotations`              | ServiceAccount annotations                    |                                                         |
| `plutono.serviceAccount.create`                   | Create service account                        | `true`                                                  |
| `plutono.serviceAccount.labels`                   | ServiceAccount labels                         | `{}`                                                    |
| `plutono.serviceAccount.name`                     | Service account name to use, when empty will be set to created account if `serviceAccount.create` is set else to `default` | `` |
| `plutono.serviceAccount.nameTest`                 | Service account name to use for test, when empty will be set to created account if `serviceAccount.create` is set else to `default` | `nil` |
| `plutono.rbac.create`                             | Create and use RBAC resources                 | `true`                                                  |
| `plutono.rbac.namespaced`                         | Creates Role and Rolebinding instead of the default ClusterRole and ClusteRoleBindings for the plutono instance  | `false` |
| `plutono.rbac.useExistingRole`                    | Set to a rolename to use existing role - skipping role creating - but still doing serviceaccount and rolebinding to the rolename set here. | `nil` |
| `plutono.rbac.pspEnabled`                         | Create PodSecurityPolicy (with `rbac.create`, grant roles permissions as well) | `false`                |
| `plutono.rbac.pspUseAppArmor`                     | Enforce AppArmor in created PodSecurityPolicy (requires `rbac.pspEnabled`)  | `false`                   |
| `plutono.rbac.extraRoleRules`                     | Additional rules to add to the Role           | []                                                      |
| `plutono.rbac.extraClusterRoleRules`              | Additional rules to add to the ClusterRole    | []                                                      |
| `plutono.command`                                 | Define command to be executed by plutono container at startup | `nil`                                   |
| `plutono.args`                                    | Define additional args if command is used     | `nil`                                                   |
| `plutono.testFramework.enabled`                   | Whether to create test-related resources      | `true`                                                  |
| `plutono.testFramework.image.registry`            | `test-framework` image registry.            | `docker.io`                                             |
| `plutono.testFramework.image.repository`          | `test-framework` image repository.            | `bats/bats`                                             |
| `plutono.testFramework.image.tag`                 | `test-framework` image tag.                   | `v1.4.1`                                                |
| `plutono.testFramework.imagePullPolicy`           | `test-framework` image pull policy.           | `IfNotPresent`                                          |
| `plutono.testFramework.securityContext`           | `test-framework` securityContext              | `{}`                                                    |
| `plutono.downloadDashboards.env`                  | Environment variables to be passed to the `download-dashboards` container | `{}`                        |
| `plutono.downloadDashboards.envFromSecret`        | Name of a Kubernetes secret (must be manually created in the same namespace) containing values to be added to the environment. Can be templated | `""` |
| `plutono.downloadDashboards.resources`            | Resources of `download-dashboards` container  | `{}`                                                    |
| `plutono.downloadDashboardsImage.registry`        | Curl docker image registry                    | `docker.io`                                       |
| `plutono.downloadDashboardsImage.repository`      | Curl docker image repository                  | `curlimages/curl`                                       |
| `plutono.downloadDashboardsImage.tag`             | Curl docker image tag                         | `7.73.0`                                                |
| `plutono.downloadDashboardsImage.sha`             | Curl docker image sha (optional)              | `""`                                                    |
| `plutono.downloadDashboardsImage.pullPolicy`      | Curl docker image pull policy                 | `IfNotPresent`                                          |
| `plutono.namespaceOverride`                       | Override the deployment namespace             | `""` (`Release.Namespace`)                              |
| `plutono.serviceMonitor.enabled`                  | Use servicemonitor from prometheus operator   | `false`                                                 |
| `plutono.serviceMonitor.namespace`                | Namespace this servicemonitor is installed in |                                                         |
| `plutono.serviceMonitor.interval`                 | How frequently Prometheus should scrape       | `1m`                                                    |
| `plutono.serviceMonitor.path`                     | Path to scrape                                | `/metrics`                                              |
| `plutono.serviceMonitor.scheme`                   | Scheme to use for metrics scraping            | `http`                                                  |
| `plutono.serviceMonitor.tlsConfig`                | TLS configuration block for the endpoint      | `{}`                                                    |
| `plutono.serviceMonitor.labels`                   | Labels for the servicemonitor passed to Prometheus Operator      |  `{}`                                |
| `plutono.serviceMonitor.scrapeTimeout`            | Timeout after which the scrape is ended       | `30s`                                                   |
| `plutono.serviceMonitor.relabelings`              | RelabelConfigs to apply to samples before scraping.     | `[]`                                      |
| `plutono.serviceMonitor.metricRelabelings`        | MetricRelabelConfigs to apply to samples before ingestion.  | `[]`                                      |
| `plutono.revisionHistoryLimit`                    | Number of old ReplicaSets to retain           | `10`                                                    |
| `plutono.networkPolicy.enabled`                   | Enable creation of NetworkPolicy resources.   | `false`                                                 |
| `plutono.networkPolicy.allowExternal`              | Don't require client label for connections   | `true`              |
| `plutono.networkPolicy.explicitNamespacesSelector` | A Kubernetes LabelSelector to explicitly select namespaces from which traffic could be allowed | `{}`  |
| `plutono.networkPolicy.ingress`                    | Enable the creation of an ingress network policy             | `true`    |
| `plutono.networkPolicy.egress.enabled`             | Enable the creation of an egress network policy              | `false`   |
| `plutono.networkPolicy.egress.ports`               | An array of ports to allow for the egress                    | `[]`    |
| `plutono.enableKubeBackwardCompatibility`          | Enable backward compatibility of kubernetes where pod's definition version below 1.13 doesn't have the enableServiceLinks option  | `false`     |

### Example of extraVolumeMounts and extraVolumes

Configure additional volumes with `extraVolumes` and volume mounts with `extraVolumeMounts`.

Example for `extraVolumeMounts` and corresponding `extraVolumes`:

```yaml
extraVolumeMounts:
  - name: plugins
    mountPath: /var/lib/plutono/plugins
    subPath: configs/plutono/plugins
    readOnly: false
  - name: dashboards
    mountPath: /var/lib/plutono/dashboards
    hostPath: /usr/shared/plutono/dashboards
    readOnly: false

extraVolumes:
  - name: plugins
    existingClaim: existing-plutono-claim
  - name: dashboards
    hostPath: /usr/shared/plutono/dashboards
```

Volumes default to `emptyDir`. Set to `persistentVolumeClaim`,
`hostPath`, `csi`, or `configMap` for other types. For a
`persistentVolumeClaim`, specify an existing claim name with
`existingClaim`.

## Import dashboards

There are a few methods to import dashboards to Plutono. Below are some examples and explanations as to how to use each method:

```yaml
dashboards:
  default:
    some-dashboard:
      json: |
        {
          "annotations":

          ...
          # Complete json file here
          ...

          "title": "Some Dashboard",
          "uid": "abcd1234",
          "version": 1
        }
    custom-dashboard:
      # This is a path to a file inside the dashboards directory inside the chart directory
      file: dashboards/custom-dashboard.json
    prometheus-stats:
      # Ref: https://plutono.com/dashboards/2
      gnetId: 2
      revision: 2
      datasource: Prometheus
    loki-dashboard-quick-search:
      gnetId: 12019
      revision: 2
      datasource:
      - name: DS_PROMETHEUS
        value: Prometheus
    local-dashboard:
      url: https://raw.githubusercontent.com/user/repository/master/dashboards/dashboard.json
```

## Create a dashboard

1. Click **Dashboards** in the main menu.
2. Click **New** and select **New Dashboard**.
3. Click **Add new empty panel**.
4. **Important:** Add a datasource variable as they are provisioned in the cluster.
   - Go to **Dashboard settings**.
   - Click **Variables**.
   - Click **Add variable**.
   - General: Configure the variable with a proper **Name** as **Type** `Datasource`.
   - Data source options: Select the data source **Type** e.g. `Prometheus`.
   - Click **Update**.
   - Go back.

5. Develop your panels.
   - On the **Edit panel** view, choose your desired **Visualization**.
   - Select the datasource variable you just created.
   - Write or construct a query in the query language of your data source.
   - Move and resize the panels as needed.
6. Optionally add a **tag** to the dashboard to make grouping easier.
   - Go to **Dashboard settings**.
   - In the **General** section, add a **Tag**.
7. Click **Save**. Note that the dashboard is saved in the browser's local storage.
8. Export the dashboard.
   - Go to **Dashboard settings**.
   - Click **JSON Model**.
   - Copy the JSON model.
   - Go to your Github repository and create a new JSON file in the `dashboards` directory.

## BASE64 dashboards

Dashboards could be stored on a server that does not return JSON directly and instead of it returns a Base64 encoded file (e.g. Gerrit)
A new parameter has been added to the url use case so if you specify a b64content value equals to true after the url entry a Base64 decoding is applied before save the file to disk.
If this entry is not set or is equals to false not decoding is applied to the file before saving it to disk.

### Gerrit use case

Gerrit API for download files has the following schema: <https://yourgerritserver/a/{project-name}/branches/{branch-id}/files/{file-id}/content> where {project-name} and
{file-id} usually has '/' in their values and so they MUST be replaced by %2F so if project-name is user/repo, branch-id is master and file-id is equals to dir1/dir2/dashboard
the url value is <https://yourgerritserver/a/user%2Frepo/branches/master/files/dir1%2Fdir2%2Fdashboard/content>

## Sidecar for dashboards

If the parameter `sidecar.dashboards.enabled` is set, a sidecar container is deployed in the plutono
pod. This container watches all configmaps (or secrets) in the cluster and filters out the ones with
a label as defined in `sidecar.dashboards.label`. The files defined in those configmaps are written
to a folder and accessed by plutono. Changes to the configmaps are monitored and the imported
dashboards are deleted/updated.

A recommendation is to use one configmap per dashboard, as a reduction of multiple dashboards inside
one configmap is currently not properly mirrored in plutono.

NOTE: Configure your data sources in your dashboards as variables to keep them portable across clusters.

#### Example dashboard config:

*Folder structure:*
```bash
dashboards/
├── dashboard1.json
├── dashboard2.json
templates/
├──dashboard-json-configmap.yaml
```

*Helm template to create a configmap for each dashboard:*
```yaml
{{- range $path, $bytes := .Files.Glob "dashboards/*.json" }}
---
apiVersion: v1
kind: ConfigMap

metadata:
  name: {{ printf "%s-%s" $.Release.Name $path | replace "/" "-" | trunc 63 }}
  labels:
    plutono-dashboard: "true"

data:
{{ printf "%s: |-" $path | replace "/" "-" | indent 2 }}
{{ printf "%s" $bytes | indent 4 }}

{{- end }}
```

## Sidecar for datasources

If the parameter `sidecar.datasources.enabled` is set, an init container is deployed in the plutono
pod. This container lists all secrets (or configmaps, though not recommended) in the cluster and
filters out the ones with a label as defined in `sidecar.datasources.label`. The files defined in
those secrets are written to a folder and accessed by plutono on startup. Using these yaml files,
the data sources in plutono can be imported.

Should you aim for reloading datasources in Plutono each time the config is changed, set `sidecar.datasources.skipReload: false` and adjust `sidecar.datasources.reloadURL` to `http://<svc-name>.<namespace>.svc.cluster.local/api/admin/provisioning/datasources/reload`.

Secrets are recommended over configmaps for this usecase because datasources usually contain private
data like usernames and passwords. Secrets are the more appropriate cluster resource to manage those.

#### Example datasource config:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: plutono-datasources
  labels:
    # default value for: sidecar.datasources.label
    plutono-datasource: "true"
stringData:
  datasources.yaml: |-
    apiVersion: 1
    datasources:
      - name: my-prometheus 
        type: prometheus
        access: proxy
        orgId: 1
        url: my-url-domain:9090
        isDefault: false
        jsonData:
          httpMethod: 'POST'
        editable: false
```

**NOTE:** If you might include credentials in your datasource configuration, make sure to not use stringdata but base64 encoded data instead.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-datasource
  labels:
    plutono-datasource: "true"
data:
  # The key must contain a unique name and the .yaml file type
  my-datasource.yaml: {{ include (print $.Template.BasePath "my-datasource.yaml") . | b64enc }}
```

Example values to add a datasource adapted from [Grafana](http://docs.grafana.org/administration/provisioning/#example-datasource-config-file):

```yaml
datasources:
 datasources.yaml:
  apiVersion: 1
  datasources:
      # <string, required> Sets the name you use to refer to
      # the data source in panels and queries.
    - name: my-prometheus 
      # <string, required> Sets the data source type.
      type: prometheus
      # <string, required> Sets the access mode, either
      # proxy or direct (Server or Browser in the UI).
      # Some data sources are incompatible with any setting
      # but proxy (Server).
      access: proxy
      # <int> Sets the organization id. Defaults to orgId 1.
      orgId: 1
      # <string> Sets a custom UID to reference this
      # data source in other parts of the configuration.
      # If not specified, Plutono generates one.
      uid:
      # <string> Sets the data source's URL, including the
      # port.
      url: my-url-domain:9090
      # <string> Sets the database user, if necessary.
      user:
      # <string> Sets the database name, if necessary.
      database:
      # <bool> Enables basic authorization.
      basicAuth:
      # <string> Sets the basic authorization username.
      basicAuthUser:
      # <bool> Enables credential headers.
      withCredentials:
      # <bool> Toggles whether the data source is pre-selected
      # for new panels. You can set only one default
      # data source per organization.
      isDefault: false
      # <map> Fields to convert to JSON and store in jsonData.
      jsonData:
        httpMethod: 'POST'
        # <bool> Enables TLS authentication using a client
        # certificate configured in secureJsonData.
        # tlsAuth: true
        # <bool> Enables TLS authentication using a CA
        # certificate.
        # tlsAuthWithCACert: true
      # <map> Fields to encrypt before storing in jsonData.
      secureJsonData:
        # <string> Defines the CA cert, client cert, and
        # client key for encrypted authentication.
        # tlsCACert: '...'
        # tlsClientCert: '...'
        # tlsClientKey: '...'
        # <string> Sets the database password, if necessary.
        # password:
        # <string> Sets the basic authorization password.
        # basicAuthPassword:
      # <int> Sets the version. Used to compare versions when
      # updating. Ignored when creating a new data source.
      version: 1
      # <bool> Allows users to edit data sources from the
      # Plutono UI.
      editable: false
```

## How to serve Plutono with a path prefix (/plutono)

In order to serve Plutono with a prefix (e.g., <http://example.com/plutono>), add the following to your values.yaml.

```yaml
ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: /$1
    nginx.ingress.kubernetes.io/use-regex: "true"

  path: /plutono/?(.*)
  hosts:
    - k8s.example.dev

plutono.ini:
  server:
    root_url: http://localhost:3000/plutono # this host can be localhost
```

## How to securely reference secrets in plutono.ini

This example uses Plutono [file providers](https://plutono.com/docs/plutono/latest/administration/configuration/#file-provider) for secret values and the `extraSecretMounts` configuration flag (Additional plutono server secret mounts) to mount the secrets.

In plutono.ini:

```yaml
plutono.ini:
  [auth.generic_oauth]
  enabled = true
  client_id = $__file{/etc/secrets/auth_generic_oauth/client_id}
  client_secret = $__file{/etc/secrets/auth_generic_oauth/client_secret}
```

Existing secret, or created along with helm:

```yaml
---
apiVersion: v1
kind: Secret
metadata:
  name: auth-generic-oauth-secret
type: Opaque
stringData:
  client_id: <value>
  client_secret: <value>
```

Include in the `extraSecretMounts` configuration flag:

```yaml
- extraSecretMounts:
  - name: auth-generic-oauth-secret-mount
    secretName: auth-generic-oauth-secret
    defaultMode: 0440
    mountPath: /etc/secrets/auth_generic_oauth
    readOnly: true
```
