---
title: Plutono
---

Installs the web dashboarding system [Plutono](https://github.com/credativ/plutono)

# Owner

1. Richard Tief (@richardtief)
2. Tommy Sauer (@viennaa)

## Configuration

| parameter                                 | Description                                   | Default                                                 |
|-------------------------------------------|-----------------------------------------------|---------------------------------------------------------|
| `plutono.replicas`                                | Number of nodes                               | `1`                                                     |
| `plutono.deploymentStrategy`                      | Deployment strategy                           | `{ "type": "RollingUpdate" }`                           |
| `plutono.livenessProbe`                           | Liveness Probe settings                       | `{ "httpGet": { "path": "/api/health", "port": 3000 } "initialDelaySeconds": 60, "timeoutSeconds": 30, "failureThreshold": 10 }` |
| `plutono.readinessProbe`                          | Readiness Probe settings                      | `{ "httpGet": { "path": "/api/health", "port": 3000 } }`|
| `plutono.securityContext`                         | Deployment securityContext                    | `{"runAsUser": 472, "runAsGroup": 472, "fsGroup": 472}`  |
| `plutono.priorityClassName`                       | Name of Priority Class to assign pods         | `nil`                                                   |
| `plutono.image.repository`                        | Image repository                              | `plutono/plutono`                                       |
| `plutono.image.tag`                               | Image tag (`Must be >= 5.0.0`)                | `7.4.5`                                                 |
| `plutono.image.sha`                               | Image sha (optional)                          | `2b56f6106ddc376bb46d974230d530754bf65a640dfbc5245191d72d3b49efc6` |
| `plutono.image.pullPolicy`                        | Image pull policy                             | `IfNotPresent`                                          |
| `plutono.image.pullSecrets`                       | Image pull secrets                            | `{}`                                                    |
| `plutono.service.enabled`                         | Enable plutono service                        | `true`                                                  |
| `plutono.service.type`                            | Kubernetes service type                       | `ClusterIP`                                             |
| `plutono.service.port`                            | Kubernetes port where service is exposed      | `80`                                                    |
| `plutono.service.portName`                        | Name of the port on the service               | `service`                                               |
| `plutono.service.targetPort`                      | Internal service is port                      | `3000`                                                  |
| `plutono.service.nodePort`                        | Kubernetes service nodePort                   | `nil`                                                   |
| `plutono.service.annotations`                     | Service annotations                           | `{}`                                                    |
| `plutono.service.labels`                          | Custom labels                                 | `{}`                                                    |
| `plutono.service.clusterIP`                       | internal cluster service IP                   | `nil`                                                   |
| `plutono.service.loadBalancerIP`                  | IP address to assign to load balancer (if supported) | `nil`                                            |
| `plutono.service.loadBalancerSourceRanges`        | list of IP CIDRs allowed access to lb (if supported) | `[]`                                             |
| `plutono.service.externalIPs`                     | service external IP addresses                 | `[]`                                                    |
| `plutono.extraExposePorts`                        | Additional service ports for sidecar containers| `[]`                                                   |
| `plutono.hostAliases`                             | adds rules to the pod's /etc/hosts            | `[]`                                                    |
| `plutono.ingress.enabled`                         | Enables Ingress                               | `false`                                                 |
| `plutono.ingress.annotations`                     | Ingress annotations (values are templated)    | `{}`                                                    |
| `plutono.ingress.labels`                          | Custom labels                                 | `{}`                                                    |
| `plutono.ingress.path`                            | Ingress accepted path                         | `/`                                                     |
| `plutono.ingress.pathType`                        | Ingress type of path                          | `Prefix`                                                |
| `plutono.ingress.hosts`                           | Ingress accepted hostnames                    | `["chart-example.local"]`                                                    |
| `plutono.ingress.extraPaths`                      | Ingress extra paths to prepend to every host configuration. Useful when configuring [custom actions with AWS ALB Ingress Controller](https://kubernetes-sigs.github.io/aws-alb-ingress-controller/guide/ingress/annotation/#actions). | `[]`                                                    |
| `plutono.ingress.tls`                             | Ingress TLS configuration                     | `[]`                                                    |
| `plutono.resources`                               | CPU/Memory resource requests/limits           | `{}`                                                    |
| `plutono.nodeSelector`                            | Node labels for pod assignment                | `{}`                                                    |
| `plutono.tolerations`                             | Toleration labels for pod assignment          | `[]`                                                    |
| `plutono.affinity`                                | Affinity settings for pod assignment          | `{}`                                                    |
| `plutono.extraInitContainers`                     | Init containers to add to the plutono pod     | `{}`                                                    |
| `plutono.extraContainers`                         | Sidecar containers to add to the plutono pod  | `{}`                                                    |
| `plutono.extraContainerVolumes`                   | Volumes that can be mounted in sidecar containers | `[]`                                                |
| `plutono.extraLabels`                             | Custom labels for all manifests               | `{}`                                                    |
| `plutono.schedulerName`                           | Name of the k8s scheduler (other than default) | `nil`                                                  |
| `plutono.persistence.enabled`                     | Use persistent volume to store data           | `false`                                                 |
| `plutono.persistence.type`                        | Type of persistence (`pvc` or `statefulset`)  | `pvc`                                                   |
| `plutono.persistence.size`                        | Size of persistent volume claim               | `10Gi`                                                  |
| `plutono.persistence.existingClaim`               | Use an existing PVC to persist data           | `nil`                                                   |
| `plutono.persistence.storageClassName`            | Type of persistent volume claim               | `nil`                                                   |
| `plutono.persistence.accessModes`                 | Persistence access modes                      | `[ReadWriteOnce]`                                       |
| `plutono.persistence.annotations`                 | PersistentVolumeClaim annotations             | `{}`                                                    |
| `plutono.persistence.finalizers`                  | PersistentVolumeClaim finalizers              | `[ "kubernetes.io/pvc-protection" ]`                    |
| `plutono.persistence.subPath`                     | Mount a sub dir of the persistent volume      | `nil`                                                   |
| `plutono.persistence.inMemory.enabled`            | If persistence is not enabled, whether to mount the local storage in-memory to improve performance | `false`                                                   |
| `plutono.persistence.inMemory.sizeLimit`          | SizeLimit for the in-memory local storage     | `nil`                                                   |
| `plutono.schedulerName`                           | Alternate scheduler name                      | `nil`                                                   |
| `plutono.env`                                     | Extra environment variables passed to pods    | `{}`                                                    |
| `plutono.envValueFrom`                            | Environment variables from alternate sources. See the API docs on [EnvVarSource](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.17/#envvarsource-v1-core) for format details.  | `{}` |
| `plutono.envFromSecret`                           | Name of a Kubernetes secret (must be manually created in the same namespace) containing values to be added to the environment. Can be templated | `""` |
| `plutono.envRenderSecret`                         | Sensible environment variables passed to pods and stored as secret | `{}`                               |
| `plutono.extraSecretMounts`                       | Additional plutono server secret mounts       | `[]`                                                    |
| `plutono.extraVolumeMounts`                       | Additional plutono server volume mounts       | `[]`                                                    |
| `plutono.extraConfigmapMounts`                    | Additional plutono server configMap volume mounts | `[]`                                                |
| `plutono.extraEmptyDirMounts`                     | Additional plutono server emptyDir volume mounts | `[]`                                                 |
| `plutono.datasources`                             | Configure plutono datasources (passed through tpl) | `{}`                                               |
| `plutono.dashboards`                              | Dashboards to import                          | `{}`                                                    |
| `plutono.plutono.ini`                             | Plutono's primary configuration               | `{}`                                                    |
| `plutono.ldap.enabled`                            | Enable LDAP authentication                    | `false`                                                 |
| `plutono.ldap.existingSecret`                     | The name of an existing secret containing the `ldap.toml` file, this must have the key `ldap-toml`. | `""` |
| `plutono.ldap.config`                             | Plutono's LDAP configuration                  | `""`                                                    |
| `plutono.annotations`                             | Deployment annotations                        | `{}`                                                    |
| `plutono.labels`                                  | Deployment labels                             | `{}`                                                    |
| `plutono.podAnnotations`                          | Pod annotations                               | `{}`                                                    |
| `plutono.podLabels`                               | Pod labels                                    | `{}`                                                    |
| `plutono.podPortName`                             | Name of the plutono port on the pod           | `plutono`                                               |
| `plutono.sidecar.image.repository`                | Sidecar image repository                      | `quay.io/kiwigrid/k8s-sidecar`                          |
| `plutono.sidecar.image.tag`                       | Sidecar image tag                             | `1.10.7`                                                |
| `plutono.sidecar.image.sha`                       | Sidecar image sha (optional)                  | `""`                                                    |
| `plutono.sidecar.imagePullPolicy`                 | Sidecar image pull policy                     | `IfNotPresent`                                          |
| `plutono.sidecar.resources`                       | Sidecar resources                             | `{}`                                                    |
| `plutono.sidecar.enableUniqueFilenames`           | Sets the kiwigrid/k8s-sidecar UNIQUE_FILENAMES environment variable | `false`                           |
| `plutono.sidecar.dashboards.enabled`              | Enables the cluster wide search for dashboards and adds/updates/deletes them in plutono | `false`       |
| `plutono.sidecar.dashboards.watchMethod`          | Method to use to detect ConfigMap changes. With WATCH the sidecar will do a WATCH requests, with SLEEP it will list all ConfigMaps, then sleep for 60 seconds. | `WATCH` |
| `plutono.sidecar.skipTlsVerify`                   | Set to true to skip tls verification for kube api calls | `nil`                                         |
| `plutono.sidecar.dashboards.label`                | Label that config maps with dashboards should have to be added | `plutono_dashboard`                                |
| `plutono.sidecar.dashboards.labelValue`                | Label value that config maps with dashboards should have to be added | `nil`                                |
| `plutono.sidecar.dashboards.folder`               | Folder in the pod that should hold the collected dashboards (unless `sidecar.dashboards.defaultFolderName` is set). This path will be mounted. | `/tmp/dashboards`    |
| `plutono.sidecar.dashboards.folderAnnotation`     | The annotation the sidecar will look for in configmaps to override the destination folder for files | `nil`                                                  |
| `plutono.sidecar.dashboards.defaultFolderName`    | The default folder name, it will create a subfolder under the `sidecar.dashboards.folder` and put dashboards in there instead | `nil`                                |
| `plutono.sidecar.dashboards.searchNamespace`      | If specified, the sidecar will search for dashboard config-maps inside this namespace. Otherwise the namespace in which the sidecar is running will be used. It's also possible to specify ALL to search in all namespaces | `nil`                                |
| `plutono.sidecar.dashboards.resource`             | Should the sidecar looks into secrets, configmaps or both. | `both`                               |
| `plutono.sidecar.datasources.enabled`             | Enables the cluster wide search for datasources and adds/updates/deletes them in plutono |`false`       |
| `plutono.sidecar.datasources.label`               | Label that config maps with datasources should have to be added | `plutono_datasource`                               |
| `plutono.sidecar.datasources.labelValue`          | Label value that config maps with datasources should have to be added | `nil`                                |
| `plutono.sidecar.datasources.searchNamespace`     | If specified, the sidecar will search for datasources config-maps inside this namespace. Otherwise the namespace in which the sidecar is running will be used. It's also possible to specify ALL to search in all namespaces | `nil`                               |
| `plutono.sidecar.datasources.resource`            | Should the sidecar looks into secrets, configmaps or both. | `both`                               |
| `plutono.sidecar.notifiers.resource`              | Should the sidecar looks into secrets, configmaps or both. | `both`                               |
| `plutono.admin.existingSecret`                    | The name of an existing secret containing the admin credentials. | `""`                                 |
| `plutono.admin.userKey`                           | The key in the existing admin secret containing the username. | `"admin-user"`                          |
| `plutono.admin.passwordKey`                       | The key in the existing admin secret containing the password. | `"admin-password"`                      |
| `plutono.serviceAccount.annotations`              | ServiceAccount annotations                    |                                                         |
| `plutono.serviceAccount.create`                   | Create service account                        | `true`                                                  |
| `plutono.serviceAccount.name`                     | Service account name to use, when empty will be set to created account if `serviceAccount.create` is set else to `default` | `` |
| `plutono.serviceAccount.nameTest`                 | Service account name to use for test, when empty will be set to created account if `serviceAccount.create` is set else to `default` | `nil` |
| `plutono.rbac.create`                             | Create and use RBAC resources                 | `true`                                                  |
| `plutono.rbac.namespaced`                         | Creates Role and Rolebinding instead of the default ClusterRole and ClusteRoleBindings for the plutono instance  | `false` |
| `plutono.rbac.useExistingRole`                    | Set to a rolename to use existing role - skipping role creating - but still doing serviceaccount and rolebinding to the rolename set here. | `nil` |
| `plutono.rbac.pspEnabled`                         | Create PodSecurityPolicy (with `rbac.create`, grant roles permissions as well) | `true`                 |
| `plutono.rbac.pspUseAppArmor`                     | Enforce AppArmor in created PodSecurityPolicy (requires `rbac.pspEnabled`)  | `true`                    |
| `plutono.rbac.extraRoleRules`                     | Additional rules to add to the Role           | []                                                      |
| `plutono.rbac.extraClusterRoleRules`              | Additional rules to add to the ClusterRole    | []                                                      |
| `plutono.command`                     | Define command to be executed by plutono container at startup  | `nil`                                              |
| `plutono.namespaceOverride`                       | Override the deployment namespace             | `""` (`Release.Namespace`)                              |
| `plutono.serviceMonitor.enabled`                  | Use servicemonitor from prometheus operator   | `false`                                                 |
| `plutono.serviceMonitor.namespace`                | Namespace this servicemonitor is installed in |                                                         |
| `plutono.serviceMonitor.interval`                 | How frequently Prometheus should scrape       | `1m`                                                    |
| `plutono.serviceMonitor.path`                     | Path to scrape                                | `/metrics`                                              |
| `plutono.serviceMonitor.scheme`                   | Scheme to use for metrics scraping            | `http`                                                  |
| `plutono.serviceMonitor.tlsConfig`                | TLS configuration block for the endpoint      | `{}`                                                    |
| `plutono.serviceMonitor.labels`                   | Labels for the servicemonitor passed to Prometheus Operator      |  `{}`                                |
| `plutono.serviceMonitor.scrapeTimeout`            | Timeout after which the scrape is ended       | `30s`                                                   |
| `plutono.serviceMonitor.relabelings`              | MetricRelabelConfigs to apply to samples before ingestion.  | `[]`                                      |
| `plutono.revisionHistoryLimit`                    | Number of old ReplicaSets to retain           | `10`                                                    |

## Sidecar for dashboards

The `sidecar.dashboards.enabled` parameter is set by default so that a sidecar container is provided in the plutono pod. This container monitors all configmaps (or secrets) in the cluster and filters those with a `plutono-dashboard: "true"` label. The files defined in these configmaps are written to a folder and retrieved by plutono. Changes to the configmaps are monitored and the imported dashboards are deleted/updated.

It is recommended to use one Configmap per dashboard, as a reduction of several dashboards within a Configmap of a Configmap is currently not mapped correctly in plutono.

To map dashboard JSON files in a ConfigMap or in a Secret, the following folder structure and Helm template is useful:   

Example dashboard config:
```bash
dashboards/
├── dashboard1.json
├── dashboard2.json
dashboard-json-configmap.yaml
```
---
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

{{- end }}```

## Sidecar for datasources

The parameter `sidecar.datasources.enabled` is also set by default and provides an init container in the plutono pod.
This container lists all secrets (or configmaps, which is not recommended) in the cluster and filters out those that
have a `plutono-datasource: "true"` defined in the labels. The datasources defined in the files are written to a folder
and called by plutono at startup.

Secrets are recommended over configmaps for this use case, as data sources usually contain private data such as user
names and passwords. Secrets are the more suitable cluster resource for managing these.

Example values for adding a data source, adapted from [Grafana](http://docs.Grafana.org/administration/provisioning/#example-datasource-config-file):

```yaml
datasources:
  # <string, required> name of the datasource. Required
- name: Graphite
  # <string, required> datasource type. Required
  type: graphite
  # <string, required> access mode. proxy or direct (Server or Browser in the UI). Required
  access: proxy
  # <int> org id. will default to orgId 1 if not specified
  orgId: 1
  # <string> url
  url: http://localhost:8080
  # <string> database password, if used
  password:
  # <string> database user, if used
  user:
  # <string> database name, if used
  database:
  # <bool> enable/disable basic auth
  basicAuth:
  # <string> basic auth username
  basicAuthUser:
  # <string> basic auth password
  basicAuthPassword:
  # <bool> enable/disable with credentials headers
  withCredentials:
  # <bool> mark as default datasource. Max one per org
  isDefault:
  # <map> fields that will be converted to json and stored in json_data
  jsonData:
     graphiteVersion: "1.1"
     tlsAuth: true
     tlsAuthWithCACert: true
  # <string> json object of data that will be encrypted.
  secureJsonData:
    tlsCACert: "..."
    tlsClientCert: "..."
    tlsClientKey: "..."
  version: 1
  # <bool> allow users to edit datasources from the UI.
  editable: false
```

## How to securely reference secrets in plutono.ini

This example uses Plutono uses [file providers](https://plutono.com/docs/plutono/latest/administration/configuration/#file-provider) for secret values and the `extraSecretMounts` configuration flag (Additional plutono server secret mounts) to mount the secrets.

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
