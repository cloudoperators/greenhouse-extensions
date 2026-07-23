---
title: OpenSearch
---

## OpenSearch Plugin

The **OpenSearch** plugin sets up an OpenSearch environment using the **OpenSearch Operator**, automating deployment, provisioning, management, and orchestration of OpenSearch clusters and dashboards. It functions as the backend for logs gathered by collectors such as OpenTelemetry collectors, enabling storage and visualization of logs for Greenhouse-onboarded Kubernetes clusters.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

OpenSearch is a distributed search and analytics engine designed for real-time log and event data analysis.
The **OpenSearch Operator** simplifies the management of OpenSearch clusters by providing declarative APIs for configuration and scaling.

### Components included in this Plugin:

- [OpenSearch Operator](https://github.com/opensearch-project/opensearch-k8s-operator)
- OpenSearch Cluster Management
- OpenSearch Dashboards Deployment
- OpenSearch Index Management
- OpenSearch Security Configuration

## Architecture

![OpenSearch Architecture](img/opensearch-arch.png)

The OpenSearch Operator automates the management of OpenSearch clusters within a Kubernetes environment. The architecture consists of:

- **OpenSearchCluster CRD**: Defines the structure and configuration of OpenSearch clusters, including node roles, scaling policies, and version management.
- **OpenSearchDashboards CRD**: Manages OpenSearch Dashboards deployments, ensuring high availability and automatic upgrades.
- **OpenSearchISMPolicy CRD**: Implements index lifecycle management, defining policies for retention, rollover, and deletion.
- **OpenSearchIndexTemplate CRD**: Enables the definition of index mappings, settings, and template structures.
- **Security Configuration via OpenSearchRole and OpenSearchUser**: Manages authentication and authorization for OpenSearch users and roles.

## Note

The initial data stream must be created manually via the OpenSearch Dashboards UI before OpenTelemetry collectors can send logs to OpenSearch. Otherwise, OpenTelemetry will create a regular index instead of a data stream.

More configurations will be added over time, and contributions of custom configurations are highly appreciated.
If you discover bugs or want to add functionality to the plugin, feel free to create a pull request.

## Quick Start

This guide provides a quick and straightforward way to use **OpenSearch** as a Greenhouse Plugin on your Kubernetes cluster.

### Prerequisites

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.
- The OpenSearch Operator installed via Helm or Kubernetes manifests.
- An OpenTelemetry or similar log ingestion pipeline configured to send logs to OpenSearch.

### Installation

#### Install via Greenhouse

1. Navigate to the **Greenhouse Dashboard**.
2. Select the **OpenSearch** plugin from the catalog.
3. Specify the target cluster and configuration options.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| additionalRuleLabels | object | `{}` | Additional labels for PrometheusRule alerts |
| auth.oidc.caPath | string | `""` | Path to CA certificate for OIDC provider verification (relative to OpenSearch config dir) Leave empty to use system CA bundle |
| auth.oidc.dashboards.baseRedirectUrl | string | `""` | Base redirect URL for OIDC callback (your dashboards URL, e.g., https://dashboards.example.com/) |
| auth.oidc.dashboards.clientId | string | `""` | OIDC client ID for OpenSearch Dashboards (required when auth.oidc.enabled is true) |
| auth.oidc.dashboards.clientSecret | string | `""` | OIDC client secret for OpenSearch Dashboards (required when auth.oidc.enabled is true) |
| auth.oidc.dashboards.scope | string | `"openid email profile"` | OIDC scopes to request |
| auth.oidc.enabled | bool | `false` | Enable OIDC authentication. When enabled, adds an OpenID Connect auth domain to OpenSearch. |
| auth.oidc.provider | string | `""` | OpenID Connect provider URL (e.g., https://provider.example.com/.well-known/openid-configuration) |
| auth.oidc.rolesKey | string | `"roles"` | Claim key to use for roles from the OIDC token |
| auth.oidc.subjectKey | string | `"name"` | Claim key to use as username from the OIDC token |
| certManager.dashboardsDnsNames | list | `["opensearch-dashboards.tld"]` | Override DNS names for OpenSearch Dashboards endpoints (used for dashboards ingress certificate) |
| certManager.defaults.durations.ca | string | `"8760h"` | Validity period for CA certificates (1 year) |
| certManager.defaults.durations.leaf | string | `"4800h"` | Validity period for leaf certificates (200 days to comply with CA/B Forum baseline requirements) |
| certManager.defaults.privateKey.algorithm | string | `"RSA"` | Algorithm used for generating private keys |
| certManager.defaults.privateKey.encoding | string | `"PKCS8"` | Encoding format for private keys (PKCS8 recommended) |
| certManager.defaults.privateKey.size | int | `2048` | Key size in bits for RSA keys |
| certManager.defaults.usages | list | `["digital signature","key encipherment","server auth","client auth"]` | List of extended key usages for certificates |
| certManager.enable | bool | `true` | Enable cert-manager integration for issuing TLS certificates |
| certManager.httpDnsNames | list | `["opensearch-client.tld"]` | Override HTTP DNS names for OpenSearch client endpoints |
| certManager.issuer.ca | object | `{"name":"opensearch-ca-issuer"}` | Name of the CA Issuer to be used for internal certs |
| certManager.issuer.digicert | object | `{}` | API group for the DigicertIssuer custom resource |
| certManager.issuer.selfSigned | object | `{"name":"opensearch-issuer"}` | Name of the self-signed issuer used to sign the internal CA certificate |
| cluster.actionGroups | list | `[]` | List of OpensearchActionGroup. Check values.yaml file for examples. |
| cluster.cluster.annotations | object | `{}` | OpenSearchCluster annotations |
| cluster.cluster.bootstrap.affinity | object | `{}` | bootstrap pod affinity rules |
| cluster.cluster.bootstrap.jvm | string | `""` | bootstrap pod jvm options. If jvm is not provided then the java heap size will be set to half of resources.requests.memory which is the recommended value for data nodes. If jvm is not provided and resources.requests.memory does not exist then value will be -Xmx512M -Xms512M |
| cluster.cluster.bootstrap.nodeSelector | object | `{}` | bootstrap pod node selectors |
| cluster.cluster.bootstrap.resources | object | `{}` | bootstrap pod cpu and memory resources |
| cluster.cluster.bootstrap.tolerations | list | `[]` | bootstrap pod tolerations |
| cluster.cluster.client.service.annotations | object | `{}` | Annotations to add to the service, e.g. disco. |
| cluster.cluster.client.service.enabled | bool | `false` | Enable or disable the external client service. |
| cluster.cluster.client.service.externalIPs | list | `[]` | List of external IPs to expose the service on. |
| cluster.cluster.client.service.loadBalancerSourceRanges | list | `[]` | List of allowed IP ranges for external access when service type is `LoadBalancer`. |
| cluster.cluster.client.service.ports | list | `[{"name":"http","port":9200,"protocol":"TCP","targetPort":9200}]` | Ports to expose for the client service. |
| cluster.cluster.client.service.type | string | `"ClusterIP"` | Kubernetes service type. Defaults to `ClusterIP`, but should be set to `LoadBalancer` to expose OpenSearch client nodes externally. |
| cluster.cluster.confMgmt.smartScaler | bool | `true` | Enable nodes to be safely removed from the cluster |
| cluster.cluster.dashboards.additionalConfig | object | `{}` | Additional properties for opensearch_dashboards.yaml. Configure auth (proxy or OIDC) via plugin preset. |
| cluster.cluster.dashboards.affinity | object | `{}` | dashboards pod affinity rules |
| cluster.cluster.dashboards.annotations | object | `{}` | dashboards annotations |
| cluster.cluster.dashboards.basePath | string | `""` | dashboards Base Path for Opensearch Clusters running behind a reverse proxy |
| cluster.cluster.dashboards.enable | bool | `true` | Enable dashboards deployment |
| cluster.cluster.dashboards.env | list | `[]` | dashboards pod env variables |
| cluster.cluster.dashboards.image | string | `"docker.io/opensearchproject/opensearch-dashboards"` | dashboards image |
| cluster.cluster.dashboards.imagePullPolicy | string | `"IfNotPresent"` | dashboards image pull policy |
| cluster.cluster.dashboards.imagePullSecrets | list | `[]` | dashboards image pull secrets |
| cluster.cluster.dashboards.labels | object | `{}` | dashboards labels |
| cluster.cluster.dashboards.nodeSelector | object | `{}` | dashboards pod node selectors |
| cluster.cluster.dashboards.opensearchCredentialsSecret | object | `{"name":"dashboards-credentials"}` | Secret that contains fields username and password for dashboards to use to login to opensearch, must only be supplied if a custom securityconfig is provided |
| cluster.cluster.dashboards.pluginsList | list | `[]` | List of dashboards plugins to install |
| cluster.cluster.dashboards.podSecurityContext | object | `{}` | dasboards pod security context configuration |
| cluster.cluster.dashboards.replicas | int | `1` | number of dashboards replicas |
| cluster.cluster.dashboards.resources | object | `{}` | dashboards pod cpu and memory resources |
| cluster.cluster.dashboards.securityContext | object | `{}` | dashboards security context configuration |
| cluster.cluster.dashboards.service.labels | object | `{}` | dashboards service metadata labels |
| cluster.cluster.dashboards.service.loadBalancerSourceRanges | list | `[]` | source ranges for a loadbalancer |
| cluster.cluster.dashboards.service.type | string | `"ClusterIP"` | dashboards service type |
| cluster.cluster.dashboards.tls.caSecret | object | `{"name":"opensearch-ca-cert"}` | Secret that contains the ca certificate as ca.crt. If this and generate=true is set the existing CA cert from that secret is used to generate the node certs. In this case must contain ca.crt and ca.key fields |
| cluster.cluster.dashboards.tls.enable | bool | `false` | Enable HTTPS for dashboards |
| cluster.cluster.dashboards.tls.generate | bool | `false` | generate certificate, if false secret must be provided |
| cluster.cluster.dashboards.tls.secret | object | `{"name":"opensearch-http-cert"}` | Optional, name of a TLS secret that contains ca.crt, tls.key and tls.crt data. If ca.crt is in a different secret provide it via the caSecret field |
| cluster.cluster.dashboards.tolerations | list | `[]` | dashboards pod tolerations |
| cluster.cluster.dashboards.version | string | `"3.7.0"` | dashboards version |
| cluster.cluster.general.additionalConfig | object | `{"plugins.security.ssl_cert_reload_enabled":"true"}` | Extra items to add to the opensearch.yml. |
| cluster.cluster.general.additionalVolumes | list | `[]` | Additional volumes to mount to all pods in the cluster. Supported volume types configMap, emptyDir, secret (with default Kubernetes configuration schema) |
| cluster.cluster.general.drainDataNodes | bool | `false` | Controls whether to drain data notes on rolling restart operations |
| cluster.cluster.general.httpPort | int | `9200` | Opensearch service http port |
| cluster.cluster.general.image | string | `"docker.io/opensearchproject/opensearch"` | Opensearch image |
| cluster.cluster.general.imagePullPolicy | string | `"IfNotPresent"` | Default image pull policy |
| cluster.cluster.general.keystore | list | `[]` | Populate opensearch keystore before startup |
| cluster.cluster.general.monitoring.enable | bool | `false` | Enable cluster monitoring |
| cluster.cluster.general.monitoring.labels | object | `{}` | ServiceMonitor labels |
| cluster.cluster.general.monitoring.monitoringUserSecret | string | `""` | Secret with 'username' and 'password' keys for monitoring user. You could also use OpenSearchUser CRD instead of setting it. |
| cluster.cluster.general.monitoring.pluginUrl | string | `"https://github.com/opensearch-project/opensearch-prometheus-exporter/releases/download/3.7.0.0/prometheus-exporter-3.7.0.0.zip"` | Custom URL for the monitoring plugin |
| cluster.cluster.general.monitoring.scrapeInterval | string | `"30s"` | How often to scrape metrics |
| cluster.cluster.general.monitoring.tlsConfig | object | `{"insecureSkipVerify":true}` | Override the tlsConfig of the generated ServiceMonitor |
| cluster.cluster.general.pluginsList | list | `[]` | List of Opensearch plugins to install |
| cluster.cluster.general.podSecurityContext | object | `{}` | Opensearch pod security context configuration |
| cluster.cluster.general.securityContext | object | `{}` | Opensearch securityContext |
| cluster.cluster.general.serviceAccount | string | `""` | Opensearch serviceAccount name. If Service Account doesn't exist it could be created by setting `serviceAccount.create` and `serviceAccount.name` |
| cluster.cluster.general.serviceName | string | `""` | Opensearch service name |
| cluster.cluster.general.setVMMaxMapCount | bool | `true` | Enable setVMMaxMapCount. OpenSearch requires the Linux kernel vm.max_map_count option to be set to at least 262144 |
| cluster.cluster.general.snapshotRepositories | list | `[]` | Opensearch snapshot repositories configuration |
| cluster.cluster.general.vendor | string | `"Opensearch"` |  |
| cluster.cluster.general.version | string | `"3.7.0"` | Opensearch version |
| cluster.cluster.ingress.dashboards.annotations | object | `{}` | dashboards ingress annotations |
| cluster.cluster.ingress.dashboards.className | string | `""` | Ingress class name |
| cluster.cluster.ingress.dashboards.enabled | bool | `false` | Enable ingress for dashboards service |
| cluster.cluster.ingress.dashboards.hosts | list | `[]` | Ingress hostnames |
| cluster.cluster.ingress.dashboards.tls | list | `[]` | Ingress tls configuration |
| cluster.cluster.ingress.opensearch.annotations | object | `{}` | Opensearch ingress annotations |
| cluster.cluster.ingress.opensearch.className | string | `""` | Opensearch Ingress class name |
| cluster.cluster.ingress.opensearch.enabled | bool | `false` | Enable ingress for Opensearch service |
| cluster.cluster.ingress.opensearch.hosts | list | `[]` | Opensearch Ingress hostnames |
| cluster.cluster.ingress.opensearch.tls | list | `[]` | Opensearch tls configuration |
| cluster.cluster.initHelper.image | string | `"docker.io/busybox"` | initHelper image repository for the init container used to set vm.max_map_count. Override for registry mirrors. |
| cluster.cluster.initHelper.imagePullPolicy | string | `"IfNotPresent"` | initHelper image pull policy |
| cluster.cluster.initHelper.imagePullSecrets | list | `[]` | initHelper image pull secret |
| cluster.cluster.initHelper.resources | object | `{}` | initHelper pod cpu and memory resources |
| cluster.cluster.initHelper.version | string | `"1.36"` | initHelper version |
| cluster.cluster.labels | object | `{}` | OpenSearchCluster labels |
| cluster.cluster.name | string | `"opensearch-logs"` | OpenSearchCluster name, by default release name is used |
| cluster.cluster.nodePools | list | <pre>nodePools:<br>  - component: node<br>    diskSize: "30Gi"<br>    replicas: 2<br>    roles:<br>      - "cluster_manager"<br>      - "data"<br>      - "ingest"<br>    resources:<br>      requests:<br>        memory: "1Gi"<br>        cpu: "500m"<br>      limits:<br>        memory: "4Gi"<br>        cpu: 2</pre> | Opensearch nodes configuration |
| cluster.cluster.security.config.adminCredentialsSecret | object | `{"name":"admin-credentials"}` | Secret that contains fields username and password to be used by the operator to access the opensearch cluster for node draining. Must be set if custom securityconfig is provided. |
| cluster.cluster.security.config.adminSecret | object | `{"name":"opensearch-admin-cert"}` | TLS Secret that contains a client certificate (tls.key, tls.crt, ca.crt) with admin rights in the opensearch cluster. Must be set if transport certificates are provided by user and not generated |
| cluster.cluster.security.config.securityConfigSecret | object | `{"name":"opensearch-security-config"}` | Secret that contains the different yml files of the opensearch-security config (config.yml, internal_users.yml, etc) |
| cluster.cluster.security.tls.http.adminDn | list | `["CN=admin"]` | DNs of certificates that should have admin access, mainly used for securityconfig updates via securityadmin.sh, only used when existing certificates are provided |
| cluster.cluster.security.tls.http.caSecret | object | `{"name":"opensearch-http-cert"}` | Optional, secret that contains the ca certificate as ca.crt. If this and generate=true is set the existing CA cert from that secret is used to generate the node certs. In this case must contain ca.crt and ca.key fields |
| cluster.cluster.security.tls.http.generate | bool | `false` | If set to true the operator will generate a CA and certificates for the cluster to use, if false - secrets with existing certificates must be supplied |
| cluster.cluster.security.tls.http.secret | object | `{"name":"opensearch-http-cert"}` | Optional, name of a TLS secret that contains ca.crt, tls.key and tls.crt data. If ca.crt is in a different secret provide it via the caSecret field |
| cluster.cluster.security.tls.transport.caSecret | object | `{"name":"opensearch-ca-cert"}` | Optional, secret that contains the ca certificate as ca.crt. If this and generate=true is set the existing CA cert from that secret is used to generate the node certs. In this case must contain ca.crt and ca.key fields |
| cluster.cluster.security.tls.transport.generate | bool | `false` | If set to true the operator will generate a CA and certificates for the cluster to use, if false secrets with existing certificates must be supplied |
| cluster.cluster.security.tls.transport.nodesDn | list | `["CN=opensearch-transport"]` | Allowed Certificate DNs for nodes, only used when existing certificates are provided |
| cluster.cluster.security.tls.transport.perNode | bool | `false` | Separate certificate per node |
| cluster.cluster.security.tls.transport.secret | object | `{"name":"opensearch-transport-cert"}` | Optional, name of a TLS secret that contains ca.crt, tls.key and tls.crt data. If ca.crt is in a different secret provide it via the caSecret field |
| cluster.componentTemplates | list | See values.yaml | List of OpensearchComponentTemplate. |
| cluster.fullnameOverride | string | `""` |  |
| cluster.indexTemplates | list | See values.yaml | List of OpensearchIndexTemplate. Includes template for logs* data stream. |
| cluster.ismPolicies | list | See values.yaml | List of OpenSearchISMPolicy. Includes 7-day retention policy for logs* indices. |
| cluster.nameOverride | string | `""` |  |
| cluster.roles | list | See values.yaml | List of OpensearchRole. Includes read and write roles for logs* indices. |
| cluster.savedObjects | object | disabled | Bootstrap OpenSearch Dashboards saved objects (index patterns, dashboards, visualizations). Runs as a post-install/upgrade Helm hook Job that POSTs to the Dashboards API. |
| cluster.savedObjects.backoffLimit | int | `6` | Job backoff limit. |
| cluster.savedObjects.credentialsSecret | object | `{"name":"dashboards-credentials","passwordKey":"password","usernameKey":"username"}` | Credentials Secret for a user that can write `.kibana*`. |
| cluster.savedObjects.dashboardsHost | string | `""` | Dashboards URL. Defaults to the in-cluster HTTP Service. |
| cluster.savedObjects.enabled | bool | `false` | Enable the saved-objects bootstrap Job. |
| cluster.savedObjects.image | object | `{"pullPolicy":"IfNotPresent"}` | Image pull policy for the Job. Image is the cluster's OpenSearch image. |
| cluster.savedObjects.imports | list | `[]` | NDJSON saved-object bundles to import. Each entry references a key in an existing ConfigMap (created out of band). |
| cluster.savedObjects.indexPatterns | list | `[]` | Index patterns to upsert by id. |
| cluster.savedObjects.nodeSelector | object | `{}` | Job pod nodeSelector. |
| cluster.savedObjects.podSecurityContext | object | `{"runAsNonRoot":true,"runAsUser":65534}` | Pod-level securityContext. |
| cluster.savedObjects.resources | object | `{}` | Job pod resources. |
| cluster.savedObjects.tolerations | list | `[]` | Job pod tolerations. |
| cluster.savedObjects.ttlSecondsAfterFinished | int | `86400` | Seconds to keep finished Job pods before garbage collection. |
| cluster.savedObjects.waitTimeoutSeconds | int | `300` | Seconds to wait for Dashboards readiness before failing. |
| cluster.serviceAccount.annotations | object | `{}` | Service Account annotations |
| cluster.serviceAccount.create | bool | `false` | Create Service Account |
| cluster.serviceAccount.name | string | `""` | Service Account name. Set `general.serviceAccount` to use this Service Account for the Opensearch cluster |
| cluster.snapshotLifecycle | object | disabled | Snapshot lifecycle. Registers snapshot repositories and installs ISM/SM policies via a one-shot Job. Implemented over the raw HTTP API because OpensearchISMPolicy CRD does not yet expose convert_index_to_remote (tracked in opensearch-k8s-operator#1402). End-to-end native operator support for searchable snapshots is tracked in opensearch-k8s-operator#1184. Repositories can be any type supported by OpenSearch: s3, fs, hdfs, azure, gcs. |
| cluster.snapshotLifecycle.attachRemote | object | `{"backoffLimit":3,"enabled":true,"name":"","schedule":"30 0,12 * * *"}` | CronJob that attaches the `remote-{name}-ism` policy to converted remote searchable indexes. ISM templates do not auto-attach to indexes created by `convert_index_to_remote` (opensearch-project/index-management#1389), so this job covers the gap and is a no-op when policies are already attached. |
| cluster.snapshotLifecycle.backoffLimit | int | `6` | Job backoff limit. |
| cluster.snapshotLifecycle.caSecret | object | `{"key":"ca.crt","name":"opensearch-http-cert"}` | Secret containing the CA bundle to verify the cluster's HTTP cert. Defaults to the chart's HTTP TLS secret which contains `ca.crt`. |
| cluster.snapshotLifecycle.clusterHost | string | `"https://{{ (.Values.cluster.cluster.general).serviceName | default .Values.cluster.cluster.name | default .Release.Name }}.{{ .Release.Namespace }}.svc.cluster.local:9200"` | OpenSearch URL the Job calls. The default points at the in-cluster service. The operator names that Service after `general.serviceName` when set, otherwise after `cluster.cluster.name`, otherwise after the release name. |
| cluster.snapshotLifecycle.configMapName | string | `""` | Override the ConfigMap name (default `opensearch-snapshot-lifecycle`). |
| cluster.snapshotLifecycle.credentialsSecret | object | `{"name":"snapshot-lifecycle-credentials","passwordKey":"password","usernameKey":"username"}` | Credentials secret. Provide a dedicated user with snapshot+ISM permissions; using the cluster admin is discouraged. |
| cluster.snapshotLifecycle.enabled | bool | `false` | Enable the snapshot lifecycle install Job. |
| cluster.snapshotLifecycle.image | object | `{"pullPolicy":"IfNotPresent","repository":"docker.io/library/python","tag":"3.12-slim"}` | Install Job image. Must include Python 3.11+ (the scripts use the standard library only, no `requests` dependency). |
| cluster.snapshotLifecycle.jobName | string | `""` | Override the install Job's base name (default `opensearch-snapshot-lifecycle`). The rendered name is `<jobName>-<configHash>` so each upgrade produces a fresh Job (Job pod templates are immutable). |
| cluster.snapshotLifecycle.nodeSelector | object | `{}` | Optional node selector for the install Job pod. |
| cluster.snapshotLifecycle.podSecurityContext | object | `{"runAsNonRoot":true,"runAsUser":1000}` | Pod-level securityContext for the install Job and CronJob pods. |
| cluster.snapshotLifecycle.repositories | list | `[]` | Snapshot repositories. Each entry is registered once via PUT /_snapshot/{name}. Streams reference these by name and may share a repository. |
| cluster.snapshotLifecycle.resources | object | `{}` | Optional resource requests/limits for the install Job pod. |
| cluster.snapshotLifecycle.streams | list | `[]` | List of streams to manage. Each entry produces ds-{name}-ism, remote-{name}-ism, and snapshot-{name}-delete-policy. |
| cluster.snapshotLifecycle.tlsSkipVerify | bool | `false` | TLS verification. Default verifies against `caSecret`. Set `tlsSkipVerify: true` to disable verification entirely (not recommended). |
| cluster.snapshotLifecycle.tolerations | list | `[]` | Optional tolerations for the install Job pod. |
| cluster.snapshotLifecycle.ttlSecondsAfterFinished | int | `86400` | Seconds to keep finished install Job pods before they are garbage collected. The Job name embeds a hash of all snapshotLifecycle inputs, so each upgrade creates a new Job; old completed ones expire here. |
| cluster.tenants | list | `[]` | List of additional tenants. Check values.yaml file for examples. |
| cluster.users | list | <pre>users:<br>  - name: "logs"<br>    secretName: "logs-credentials"<br>    secretKey: "password"<br>    backendRoles: []</pre> | List of OpenSearch user configurations. |
| cluster.usersCredentials | object | <pre>usersCredentials:<br>  admin:<br>    username: "admin"<br>    password: "admin"<br>    hash: ""</pre> | List of OpenSearch user credentials. These credentials are used for authenticating users with OpenSearch. See values.yaml file for a full example. |
| cluster.usersRoleBinding | list | <pre>usersRoleBinding:<br>  - name: "logs-write"<br>    users:<br>      - "logs"<br>      - "logs2"<br>    roles:<br>      - "logs-write-role"</pre> | Allows to link any number of users, backend roles and roles with a OpensearchUserRoleBinding. Each user in the binding will be granted each role |
| extraManifests | list | `[]` | Extra Kubernetes manifests to deploy alongside the chart. Each entry can be a raw YAML string or a map object. |
| operator.enabled | bool | `true` | Install the OpenSearch operator subchart with its ServiceMonitor and PrometheusRule alerts. Set false on additional releases that reuse the operator from another release. Note: CRDs in chart/crds/ are managed by Helm independently of this flag. |
| operator.fullnameOverride | string | `""` |  |
| operator.installCRDs | bool | `false` |  |
| operator.manager.dnsBase | string | `"cluster.local"` |  |
| operator.manager.extraEnv | list | `[]` |  |
| operator.manager.image.pullPolicy | string | `"Always"` |  |
| operator.manager.image.repository | string | `"opensearchproject/opensearch-operator"` |  |
| operator.manager.image.tag | string | `""` |  |
| operator.manager.imagePullSecrets | list | `[]` |  |
| operator.manager.livenessProbe.failureThreshold | int | `3` |  |
| operator.manager.livenessProbe.httpGet.path | string | `"/healthz"` |  |
| operator.manager.livenessProbe.httpGet.port | int | `8081` |  |
| operator.manager.livenessProbe.initialDelaySeconds | int | `10` |  |
| operator.manager.livenessProbe.periodSeconds | int | `15` |  |
| operator.manager.livenessProbe.successThreshold | int | `1` |  |
| operator.manager.livenessProbe.timeoutSeconds | int | `3` |  |
| operator.manager.loglevel | string | `"debug"` |  |
| operator.manager.metricsBindAddress | string | `"127.0.0.1:8080"` |  |
| operator.manager.parallelRecoveryEnabled | bool | `true` |  |
| operator.manager.pprofEndpointsEnabled | bool | `false` |  |
| operator.manager.readinessProbe.failureThreshold | int | `3` |  |
| operator.manager.readinessProbe.httpGet.path | string | `"/readyz"` |  |
| operator.manager.readinessProbe.httpGet.port | int | `8081` |  |
| operator.manager.readinessProbe.initialDelaySeconds | int | `10` |  |
| operator.manager.readinessProbe.periodSeconds | int | `15` |  |
| operator.manager.readinessProbe.successThreshold | int | `1` |  |
| operator.manager.readinessProbe.timeoutSeconds | int | `3` |  |
| operator.manager.resources.limits.cpu | string | `"200m"` |  |
| operator.manager.resources.limits.memory | string | `"500Mi"` |  |
| operator.manager.resources.requests.cpu | string | `"100m"` |  |
| operator.manager.resources.requests.memory | string | `"350Mi"` |  |
| operator.manager.securityContext.allowPrivilegeEscalation | bool | `false` |  |
| operator.manager.watchNamespace | string | `nil` |  |
| operator.nameOverride | string | `""` |  |
| operator.namespace | string | `""` |  |
| operator.nodeSelector | object | `{}` |  |
| operator.podAnnotations | object | `{}` |  |
| operator.podLabels | object | `{}` |  |
| operator.priorityClassName | string | `""` |  |
| operator.securityContext.runAsNonRoot | bool | `true` |  |
| operator.serviceAccount.create | bool | `true` |  |
| operator.serviceAccount.name | string | `"opensearch-operator-controller-manager"` |  |
| operator.tolerations | list | `[]` |  |
| operator.useRoleBindings | bool | `false` |  |
| operator.webhook.enabled | bool | `true` |  |
| operator.webhook.failurePolicy | string | `"Ignore"` |  |
| queryExporter.additionalCredentialsRefs | list | `[]` | Additional credential keys for failover (optional). Listed keys are tried in order after credentialsRef. |
| queryExporter.credentialsRef | string | `"logs"` | Credentials key from cluster.usersCredentials to use for OpenSearch access. The referenced key must exist under cluster.usersCredentials and will be mounted from the corresponding <key>-credentials Secret. |
| queryExporter.enabled | bool | `false` | Enable the OpenSearch query exporter |
| queryExporter.image.registry | string | `"ghcr.io"` | Image registry for the query exporter |
| queryExporter.image.repository | string | `"cloudoperators/opensearch-query-exporter"` | Image repository for the query exporter |
| queryExporter.image.tag | string | `"v0.1.0"` | Image tag for the query exporter |
| queryExporter.imagePullPolicy | string | `"IfNotPresent"` | Image pull policy |
| queryExporter.insecure | bool | `false` | Skip TLS verification when connecting to OpenSearch. |
| queryExporter.logLevel | string | `"info"` | Log level (debug, info, warn, error) |
| queryExporter.maxQueryRange | string | `"168h"` | Maximum allowed time range for queries (rejects queries looking back further). Prevents queries from hitting warm/cold storage tiers. |
| queryExporter.nodeSelector | object | `{}` | Node selector |
| queryExporter.podAnnotations | object | `{}` | Pod annotations |
| queryExporter.port | int | `9206` | Port the exporter listens on |
| queryExporter.queries | list | `[]` | Query configuration. Each entry defines a periodic OpenSearch query whose results are exposed as Prometheus metrics. See https://github.com/SAP-cloud-infrastructure/opensearch-query-exporter for full docs. |
| queryExporter.replicas | int | `1` | Number of replicas |
| queryExporter.resources | object | <pre>requests:<br>  cpu: 50m<br>  memory: 64Mi<br>limits:<br>  cpu: 200m<br>  memory: 128Mi</pre> | Resource requests and limits |
| queryExporter.securityContext | object | <pre>allowPrivilegeEscalation: false<br>readOnlyRootFilesystem: true<br>runAsNonRoot: true<br>runAsUser: 1000<br>capabilities:<br>  drop: [ALL]</pre> | Security context for the container |
| queryExporter.serviceMonitor.enabled | bool | `true` | Create a ServiceMonitor for the query exporter |
| queryExporter.serviceMonitor.interval | string | `"30s"` | Scrape interval |
| queryExporter.serviceMonitor.labels | object | `{}` | Additional labels for the ServiceMonitor (e.g. for Prometheus selector matching) |
| queryExporter.serviceMonitor.scrapeTimeout | string | `"25s"` | Scrape timeout |
| queryExporter.timeout | string | `"30s"` | Query timeout |
| queryExporter.tolerations | list | `[]` | Tolerations |
| s3.clients | object | <pre>clients: {}</pre> | Map of S3 client names to credentials. |
| s3.enabled | bool | `false` | Enable the S3 keystore Secret. When enabled, renders a Secret with `s3.client.<name>.access_key` / `s3.client.<name>.secret_key` entries for the repository-s3 plugin (warm nodes, snapshots). Wire the rendered Secret via `cluster.cluster.general.keystore` and configure endpoints under `cluster.cluster.general.additionalConfig`. |
| s3.secretName | string | `"opensearch-s3-keystore"` | Name of the rendered Secret. |
| serviceProxy.dashboards.enabled | bool | `true` | Expose the OpenSearch Dashboards UI through the Greenhouse service-proxy. When enabled, an extra `<cluster.cluster.name>-dashboards-ui` Service is rendered (falling back to `<release>-dashboards-ui` when `cluster.cluster.name` is not set) with the `greenhouse.sap/expose: "true"` annotation that the service-proxy watches. |
| testFramework.enabled | bool | `true` | Activates the Helm chart testing framework. |
| testFramework.image.registry | string | `"ghcr.io"` | Defines the image registry for the test framework. |
| testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` | Defines the image repository for the test framework. |
| testFramework.image.tag | string | `"main"` | Defines the image tag for the test framework. |
| testFramework.imagePullPolicy | string | `"IfNotPresent"` | Defines the image pull policy for the test framework. |

## Usage

Once deployed, OpenSearch can be accessed via OpenSearch Dashboards.

```sh
kubectl port-forward svc/opensearch-dashboards 5601:5601
```

Visit `http://localhost:5601` in your browser and log in using the configured credentials.

## Conclusion

This guide ensures that OpenSearch is fully integrated into the Greenhouse ecosystem, providing scalable log management and visualization.
Additional custom configurations can be introduced to meet specific operational needs.

For troubleshooting and further details, check out the [OpenSearch documentation](https://opensearch.org/docs/).
