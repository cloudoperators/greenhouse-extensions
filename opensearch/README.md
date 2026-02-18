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
| auth.oidc.caPath | string | `"certs/admin/ca.crt"` | Path to CA certificate for OIDC provider verification (relative to OpenSearch config dir) |
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
| cluster.cluster.bootstrap.additionalConfig | object | `{}` | bootstrap additional configuration, key-value pairs that will be added to the opensearch.yml configuration |
| cluster.cluster.bootstrap.affinity | object | `{}` | bootstrap pod affinity rules |
| cluster.cluster.bootstrap.jvm | string | `""` | bootstrap pod jvm options. If jvm is not provided then the java heap size will be set to half of resources.requests.memory which is the recommend value for data nodes. If jvm is not provided and resources.requests.memory does not exist then value will be -Xmx512M -Xms512M |
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
| cluster.cluster.dashboards.additionalConfig | object | `{}` | Additional properties for opensearch_dashboards.yaml Configure via plugin preset. For proxy auth:   opensearch.requestHeadersAllowlist: '["securitytenant","Authorization","x-forwarded-for","x-forwarded-user","x-forwarded-groups","x-forwarded-email"]'   opensearch_security.auth.type: "proxy"   opensearch_security.proxycache.user_header: "x-forwarded-user"   opensearch_security.proxycache.roles_header: "x-forwarded-groups" For OIDC auth (when auth.oidc.enabled=true):   opensearch.requestHeadersAllowlist: '["Authorization", "security_tenant"]'   opensearch_security.auth.type: '["openid"]'   opensearch_security.openid.connect_url: "https://provider.example.com/.well-known/openid-configuration"   opensearch_security.openid.client_id: "${OIDC_CLIENT_ID}"   opensearch_security.openid.client_secret: "${OIDC_CLIENT_SECRET}"   opensearch_security.openid.scope: "openid email profile"   opensearch_security.openid.base_redirect_url: "https://dashboards.example.com/" |
| cluster.cluster.dashboards.affinity | object | `{}` | dashboards pod affinity rules |
| cluster.cluster.dashboards.annotations | object | `{}` | dashboards annotations |
| cluster.cluster.dashboards.basePath | string | `""` | dashboards Base Path for Opensearch Clusters running behind a reverse proxy |
| cluster.cluster.dashboards.enable | bool | `true` | Enable dashboards deployment |
| cluster.cluster.dashboards.env | list | `[]` | dashboards pod env variables When using OIDC, add environment variables for OIDC credentials: env:   - name: OIDC_CLIENT_ID     valueFrom:       secretKeyRef:         name: opensearch-dashboards-oidc         key: client_id   - name: OIDC_CLIENT_SECRET     valueFrom:       secretKeyRef:         name: opensearch-dashboards-oidc         key: client_secret |
| cluster.cluster.dashboards.image | string | `"docker.io/opensearchproject/opensearch-dashboards"` | dashboards image |
| cluster.cluster.dashboards.imagePullPolicy | string | `"IfNotPresent"` | dashboards image pull policy |
| cluster.cluster.dashboards.imagePullSecrets | list | `[]` | dashboards image pull secrets |
| cluster.cluster.dashboards.labels | object | `{}` | dashboards labels |
| cluster.cluster.dashboards.nodeSelector | object | `{}` | dashboards pod node selectors |
| cluster.cluster.dashboards.oidc.baseRedirectUrl | string | `""` | Base redirect URL for OIDC callback (your dashboards URL, e.g., https://dashboards.example.com/) |
| cluster.cluster.dashboards.oidc.clientId | string | `""` | OIDC client ID for OpenSearch Dashboards (required when auth.oidc.enabled is true) |
| cluster.cluster.dashboards.oidc.clientSecret | string | `""` | OIDC client secret for OpenSearch Dashboards (required when auth.oidc.enabled is true) |
| cluster.cluster.dashboards.oidc.scope | string | `"openid email profile"` | OIDC scopes to request |
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
| cluster.cluster.dashboards.version | string | `"3.4.0"` | dashboards version |
| cluster.cluster.general.additionalConfig | object | `{}` | Extra items to add to the opensearch.yml |
| cluster.cluster.general.additionalVolumes | list | `[]` | Additional volumes to mount to all pods in the cluster. Supported volume types configMap, emptyDir, secret (with default Kubernetes configuration schema) |
| cluster.cluster.general.drainDataNodes | bool | `true` | Controls whether to drain data notes on rolling restart operations |
| cluster.cluster.general.httpPort | int | `9200` | Opensearch service http port |
| cluster.cluster.general.image | string | `"docker.io/opensearchproject/opensearch"` | Opensearch image |
| cluster.cluster.general.imagePullPolicy | string | `"IfNotPresent"` | Default image pull policy |
| cluster.cluster.general.keystore | list | `[]` | Populate opensearch keystore before startup |
| cluster.cluster.general.monitoring.enable | bool | `true` | Enable cluster monitoring |
| cluster.cluster.general.monitoring.labels | object | `{}` | ServiceMonitor labels |
| cluster.cluster.general.monitoring.monitoringUserSecret | string | `""` | Secret with 'username' and 'password' keys for monitoring user. You could also use OpenSearchUser CRD instead of setting it. |
| cluster.cluster.general.monitoring.pluginUrl | string | `"https://github.com/opensearch-project/opensearch-prometheus-exporter/releases/download/3.4.0.0/prometheus-exporter-3.4.0.0.zip"` | Custom URL for the monitoring plugin |
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
| cluster.cluster.general.version | string | `"3.4.0"` | Opensearch version |
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
| cluster.cluster.initHelper.imagePullPolicy | string | `"IfNotPresent"` | initHelper image pull policy |
| cluster.cluster.initHelper.imagePullSecrets | list | `[]` | initHelper image pull secret |
| cluster.cluster.initHelper.resources | object | `{}` | initHelper pod cpu and memory resources |
| cluster.cluster.initHelper.version | string | `"1.36"` | initHelper version |
| cluster.cluster.labels | object | `{}` | OpenSearchCluster labels |
| cluster.cluster.name | string | `"opensearch-logs"` | OpenSearchCluster name, by default release name is used |
| cluster.cluster.nodePools | list | <pre>nodePools:<br>  - component: main<br>    diskSize: "30Gi"<br>    replicas: 3<br>    roles:<br>      - "cluster_manager"<br>    resources:<br>      requests:<br>        memory: "1Gi"<br>        cpu: "500m"<br>      limits:<br>        memory: "2Gi"<br>        cpu: 1</pre> | Opensearch nodes configuration |
| cluster.cluster.security.config.adminCredentialsSecret | object | `{"name":"admin-credentials"}` | Secret that contains fields username and password to be used by the operator to access the opensearch cluster for node draining. Must be set if custom securityconfig is provided. |
| cluster.cluster.security.config.adminSecret | object | `{"name":"opensearch-admin-cert"}` | TLS Secret that contains a client certificate (tls.key, tls.crt, ca.crt) with admin rights in the opensearch cluster. Must be set if transport certificates are provided by user and not generated |
| cluster.cluster.security.config.securityConfigSecret | object | `{"name":"opensearch-security-config"}` | Secret that contains the differnt yml files of the opensearch-security config (config.yml, internal_users.yml, etc) |
| cluster.cluster.security.tls.http.caSecret | object | `{"name":"opensearch-http-cert"}` | Optional, secret that contains the ca certificate as ca.crt. If this and generate=true is set the existing CA cert from that secret is used to generate the node certs. In this case must contain ca.crt and ca.key fields |
| cluster.cluster.security.tls.http.generate | bool | `false` | If set to true the operator will generate a CA and certificates for the cluster to use, if false - secrets with existing certificates must be supplied |
| cluster.cluster.security.tls.http.secret | object | `{"name":"opensearch-http-cert"}` | Optional, name of a TLS secret that contains ca.crt, tls.key and tls.crt data. If ca.crt is in a different secret provide it via the caSecret field |
| cluster.cluster.security.tls.transport.adminDn | list | `["CN=admin"]` | DNs of certificates that should have admin access, mainly used for securityconfig updates via securityadmin.sh, only used when existing certificates are provided |
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
| cluster.serviceAccount.annotations | object | `{}` | Service Account annotations |
| cluster.serviceAccount.create | bool | `false` | Create Service Account |
| cluster.serviceAccount.name | string | `""` | Service Account name. Set `general.serviceAccount` to use this Service Account for the Opensearch cluster |
| cluster.tenants | list | `[]` | List of additional tenants. Check values.yaml file for examples. |
| cluster.users | list | <pre>users:<br>  - name: "logs"<br>    secretName: "logs-credentials"<br>    secretKey: "password"<br>    backendRoles: []</pre> | List of OpenSearch user configurations. |
| cluster.usersCredentials | object | <pre>usersCredentials:<br>  admin:<br>    username: "admin"<br>    password: "admin"<br>    hash: ""</pre> | List of OpenSearch user credentials. These credentials are used for authenticating users with OpenSearch. See values.yaml file for a full example. |
| cluster.usersRoleBinding | list | <pre>usersRoleBinding:<br>  - name: "logs-write"<br>    users:<br>      - "logs"<br>      - "logs2"<br>    roles:<br>      - "logs-write-role"</pre> | Allows to link any number of users, backend roles and roles with a OpensearchUserRoleBinding. Each user in the binding will be granted each role |
| operator.fullnameOverride | string | `""` |  |
| operator.installCRDs | bool | `false` |  |
| operator.kubeRbacProxy.enable | bool | `true` |  |
| operator.kubeRbacProxy.image.repository | string | `"quay.io/brancz/kube-rbac-proxy"` |  |
| operator.kubeRbacProxy.image.tag | string | `"v0.19.1"` |  |
| operator.kubeRbacProxy.livenessProbe.failureThreshold | int | `3` |  |
| operator.kubeRbacProxy.livenessProbe.httpGet.path | string | `"/healthz"` |  |
| operator.kubeRbacProxy.livenessProbe.httpGet.port | int | `10443` |  |
| operator.kubeRbacProxy.livenessProbe.httpGet.scheme | string | `"HTTPS"` |  |
| operator.kubeRbacProxy.livenessProbe.initialDelaySeconds | int | `10` |  |
| operator.kubeRbacProxy.livenessProbe.periodSeconds | int | `15` |  |
| operator.kubeRbacProxy.livenessProbe.successThreshold | int | `1` |  |
| operator.kubeRbacProxy.livenessProbe.timeoutSeconds | int | `3` |  |
| operator.kubeRbacProxy.readinessProbe.failureThreshold | int | `3` |  |
| operator.kubeRbacProxy.readinessProbe.httpGet.path | string | `"/healthz"` |  |
| operator.kubeRbacProxy.readinessProbe.httpGet.port | int | `10443` |  |
| operator.kubeRbacProxy.readinessProbe.httpGet.scheme | string | `"HTTPS"` |  |
| operator.kubeRbacProxy.readinessProbe.initialDelaySeconds | int | `10` |  |
| operator.kubeRbacProxy.readinessProbe.periodSeconds | int | `15` |  |
| operator.kubeRbacProxy.readinessProbe.successThreshold | int | `1` |  |
| operator.kubeRbacProxy.readinessProbe.timeoutSeconds | int | `3` |  |
| operator.kubeRbacProxy.resources.limits.cpu | string | `"50m"` |  |
| operator.kubeRbacProxy.resources.limits.memory | string | `"50Mi"` |  |
| operator.kubeRbacProxy.resources.requests.cpu | string | `"25m"` |  |
| operator.kubeRbacProxy.resources.requests.memory | string | `"25Mi"` |  |
| operator.kubeRbacProxy.securityContext.allowPrivilegeEscalation | bool | `false` |  |
| operator.kubeRbacProxy.securityContext.capabilities.drop[0] | string | `"ALL"` |  |
| operator.kubeRbacProxy.securityContext.readOnlyRootFilesystem | bool | `true` |  |
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
| siem.actionGroups | list | `[]` | List of OpensearchActionGroup for SIEM cluster. Check values.yaml file for examples. |
| siem.auth.oidc.caPath | string | `"certs/admin/ca.crt"` | Path to CA certificate for OIDC provider verification (relative to OpenSearch config dir) |
| siem.auth.oidc.enabled | bool | `false` | Enable OIDC authentication for SIEM cluster. When enabled, adds an OpenID Connect auth domain. |
| siem.auth.oidc.provider | string | `""` | OpenID Connect provider URL (e.g., https://provider.example.com/.well-known/openid-configuration) |
| siem.auth.oidc.rolesKey | string | `"roles"` | Claim key to use for roles from the OIDC token |
| siem.auth.oidc.subjectKey | string | `"name"` | Claim key to use as username from the OIDC token |
| siem.certManager.dashboardsDnsNames | list | `["opensearch-siem-dashboards.tld"]` | Override DNS names for SIEM OpenSearch Dashboards endpoints (used for dashboards ingress certificate) |
| siem.certManager.httpDnsNames | list | `["opensearch-siem-client.tld"]` | Override HTTP DNS names for SIEM OpenSearch client endpoints |
| siem.cluster.annotations | object | `{}` | OpenSearchCluster annotations |
| siem.cluster.bootstrap.additionalConfig | object | `{}` | bootstrap additional configuration, key-value pairs that will be added to the opensearch.yml configuration |
| siem.cluster.bootstrap.affinity | object | `{}` | bootstrap pod affinity rules |
| siem.cluster.bootstrap.jvm | string | `""` | bootstrap pod jvm options. If jvm is not provided then the java heap size will be set to half of resources.requests.memory which is the recommend value for data nodes. If jvm is not provided and resources.requests.memory does not exist then value will be -Xmx512M -Xms512M |
| siem.cluster.bootstrap.nodeSelector | object | `{}` | bootstrap pod node selectors |
| siem.cluster.bootstrap.resources | object | `{}` | bootstrap pod cpu and memory resources |
| siem.cluster.bootstrap.tolerations | list | `[]` | bootstrap pod tolerations |
| siem.cluster.client.service.annotations | object | `{}` | Annotations to add to the service, e.g. disco. |
| siem.cluster.client.service.enabled | bool | `false` | Enable or disable the external client service. |
| siem.cluster.client.service.externalIPs | list | `[]` | List of external IPs to expose the service on. |
| siem.cluster.client.service.loadBalancerSourceRanges | list | `[]` | List of allowed IP ranges for external access when service type is `LoadBalancer`. |
| siem.cluster.client.service.ports | list | `[{"name":"http","port":9200,"protocol":"TCP","targetPort":9200}]` | Ports to expose for the client service. |
| siem.cluster.client.service.type | string | `"ClusterIP"` | Kubernetes service type. Defaults to `ClusterIP`, but should be set to `LoadBalancer` to expose OpenSearch client nodes externally. |
| siem.cluster.confMgmt.smartScaler | bool | `true` | Enable nodes to be safely removed from the cluster |
| siem.cluster.dashboards.additionalConfig | object | `{}` | Additional properties for opensearch_dashboards.yaml Configure via plugin preset. For proxy auth:   opensearch.requestHeadersAllowlist: '["securitytenant","Authorization","x-forwarded-for","x-forwarded-user","x-forwarded-groups","x-forwarded-email"]'   opensearch_security.auth.type: "proxy"   opensearch_security.proxycache.user_header: "x-forwarded-user"   opensearch_security.proxycache.roles_header: "x-forwarded-groups" For OIDC auth (when siem.auth.oidc.enabled=true):   opensearch.requestHeadersAllowlist: '["Authorization", "security_tenant"]'   opensearch_security.auth.type: '["openid"]'   opensearch_security.openid.connect_url: "https://provider.example.com/.well-known/openid-configuration"   opensearch_security.openid.client_id: "${OIDC_CLIENT_ID}"   opensearch_security.openid.client_secret: "${OIDC_CLIENT_SECRET}"   opensearch_security.openid.scope: "openid email profile"   opensearch_security.openid.base_redirect_url: "https://siem-dashboards.example.com/" |
| siem.cluster.dashboards.affinity | object | `{}` | dashboards pod affinity rules |
| siem.cluster.dashboards.annotations | object | `{}` | dashboards annotations |
| siem.cluster.dashboards.basePath | string | `""` | dashboards Base Path for Opensearch Clusters running behind a reverse proxy |
| siem.cluster.dashboards.enable | bool | `true` | Enable dashboards deployment |
| siem.cluster.dashboards.env | list | `[]` | dashboards pod env variables When using OIDC, add environment variables for OIDC credentials: env:   - name: OIDC_CLIENT_ID     valueFrom:       secretKeyRef:         name: opensearch-siem-dashboards-oidc         key: client_id   - name: OIDC_CLIENT_SECRET     valueFrom:       secretKeyRef:         name: opensearch-siem-dashboards-oidc         key: client_secret |
| siem.cluster.dashboards.image | string | `"docker.io/opensearchproject/opensearch-dashboards"` | dashboards image |
| siem.cluster.dashboards.imagePullPolicy | string | `"IfNotPresent"` | dashboards image pull policy |
| siem.cluster.dashboards.imagePullSecrets | list | `[]` | dashboards image pull secrets |
| siem.cluster.dashboards.labels | object | `{}` | dashboards labels |
| siem.cluster.dashboards.nodeSelector | object | `{}` | dashboards pod node selectors |
| siem.cluster.dashboards.oidc.baseRedirectUrl | string | `""` | Base redirect URL for OIDC callback (your SIEM dashboards URL, e.g., https://siem-dashboards.example.com/) |
| siem.cluster.dashboards.oidc.clientId | string | `""` | OIDC client ID for SIEM OpenSearch Dashboards (required when siem.auth.oidc.enabled is true) |
| siem.cluster.dashboards.oidc.clientSecret | string | `""` | OIDC client secret for SIEM OpenSearch Dashboards (required when siem.auth.oidc.enabled is true) |
| siem.cluster.dashboards.oidc.scope | string | `"openid email profile"` | OIDC scopes to request |
| siem.cluster.dashboards.opensearchCredentialsSecret | object | `{"name":"siemdashboards-credentials"}` | Secret that contains fields username and password for dashboards to use to login to opensearch, must only be supplied if a custom securityconfig is provided |
| siem.cluster.dashboards.pluginsList | list | `[]` | List of dashboards plugins to install |
| siem.cluster.dashboards.podSecurityContext | object | `{}` | dasboards pod security context configuration |
| siem.cluster.dashboards.replicas | int | `1` | number of dashboards replicas |
| siem.cluster.dashboards.resources | object | `{}` | dashboards pod cpu and memory resources |
| siem.cluster.dashboards.securityContext | object | `{}` | dashboards security context configuration |
| siem.cluster.dashboards.service.labels | object | `{}` | dashboards service metadata labels |
| siem.cluster.dashboards.service.loadBalancerSourceRanges | list | `[]` | source ranges for a loadbalancer |
| siem.cluster.dashboards.service.type | string | `"ClusterIP"` | dashboards service type |
| siem.cluster.dashboards.tls.caSecret | object | `{"name":"opensearch-siem-ca-cert"}` | Secret that contains the ca certificate as ca.crt. If this and generate=true is set the existing CA cert from that secret is used to generate the node certs. In this case must contain ca.crt and ca.key fields |
| siem.cluster.dashboards.tls.enable | bool | `false` | Enable HTTPS for dashboards |
| siem.cluster.dashboards.tls.generate | bool | `false` | generate certificate, if false secret must be provided |
| siem.cluster.dashboards.tls.secret | object | `{"name":"opensearch-siem-http-cert"}` | Optional, name of a TLS secret that contains ca.crt, tls.key and tls.crt data. If ca.crt is in a different secret provide it via the caSecret field |
| siem.cluster.dashboards.tolerations | list | `[]` | dashboards pod tolerations |
| siem.cluster.dashboards.version | string | `"3.4.0"` | dashboards version |
| siem.cluster.general.additionalConfig | object | `{}` | Extra items to add to the opensearch.yml |
| siem.cluster.general.additionalVolumes | list | `[]` | Additional volumes to mount to all pods in the cluster. Supported volume types configMap, emptyDir, secret (with default Kubernetes configuration schema) |
| siem.cluster.general.drainDataNodes | bool | `true` | Controls whether to drain data notes on rolling restart operations |
| siem.cluster.general.httpPort | int | `9200` | Opensearch service http port |
| siem.cluster.general.image | string | `"docker.io/opensearchproject/opensearch"` | Opensearch image |
| siem.cluster.general.imagePullPolicy | string | `"IfNotPresent"` | Default image pull policy |
| siem.cluster.general.keystore | list | `[]` | Populate opensearch keystore before startup |
| siem.cluster.general.monitoring.enable | bool | `true` | Enable cluster monitoring |
| siem.cluster.general.monitoring.labels | object | `{}` | ServiceMonitor labels |
| siem.cluster.general.monitoring.monitoringUserSecret | string | `""` | Secret with 'username' and 'password' keys for monitoring user. You could also use OpenSearchUser CRD instead of setting it. |
| siem.cluster.general.monitoring.pluginUrl | string | `"https://github.com/opensearch-project/opensearch-prometheus-exporter/releases/download/3.4.0.0/prometheus-exporter-3.4.0.0.zip"` | Custom URL for the monitoring plugin |
| siem.cluster.general.monitoring.scrapeInterval | string | `"30s"` | How often to scrape metrics |
| siem.cluster.general.monitoring.tlsConfig | object | `{"insecureSkipVerify":true}` | Override the tlsConfig of the generated ServiceMonitor |
| siem.cluster.general.pluginsList | list | `[]` | List of Opensearch plugins to install |
| siem.cluster.general.podSecurityContext | object | `{}` | Opensearch pod security context configuration |
| siem.cluster.general.securityContext | object | `{}` | Opensearch securityContext |
| siem.cluster.general.serviceAccount | string | `""` | Opensearch serviceAccount name. If Service Account doesn't exist it could be created by setting `serviceAccount.create` and `serviceAccount.name` |
| siem.cluster.general.serviceName | string | `""` | Opensearch service name |
| siem.cluster.general.setVMMaxMapCount | bool | `true` | Enable setVMMaxMapCount. OpenSearch requires the Linux kernel vm.max_map_count option to be set to at least 262144 |
| siem.cluster.general.snapshotRepositories | list | `[]` | Opensearch snapshot repositories configuration |
| siem.cluster.general.vendor | string | `"Opensearch"` |  |
| siem.cluster.general.version | string | `"3.4.0"` | Opensearch version |
| siem.cluster.ingress.dashboards.annotations | object | `{}` | dashboards ingress annotations |
| siem.cluster.ingress.dashboards.className | string | `""` | Ingress class name |
| siem.cluster.ingress.dashboards.enabled | bool | `false` | Enable ingress for dashboards service |
| siem.cluster.ingress.dashboards.hosts | list | `[]` | Ingress hostnames |
| siem.cluster.ingress.dashboards.tls | list | `[]` | Ingress tls configuration |
| siem.cluster.ingress.opensearch.annotations | object | `{}` | Opensearch ingress annotations |
| siem.cluster.ingress.opensearch.className | string | `""` | Opensearch Ingress class name |
| siem.cluster.ingress.opensearch.enabled | bool | `false` | Enable ingress for Opensearch service |
| siem.cluster.ingress.opensearch.hosts | list | `[]` | Opensearch Ingress hostnames |
| siem.cluster.ingress.opensearch.tls | list | `[]` | Opensearch tls configuration |
| siem.cluster.initHelper.imagePullPolicy | string | `"IfNotPresent"` | initHelper image pull policy |
| siem.cluster.initHelper.imagePullSecrets | list | `[]` | initHelper image pull secret |
| siem.cluster.initHelper.resources | object | `{}` | initHelper pod cpu and memory resources |
| siem.cluster.initHelper.version | string | `"1.36"` | initHelper version |
| siem.cluster.labels | object | `{}` | OpenSearchCluster labels |
| siem.cluster.name | string | `"opensearch-siem"` | OpenSearchCluster name. If empty, subchart defaults to release name. For proper naming, set this to "{{Release.Name}}-siem" or leave empty and set via values file. Note: Helm values.yaml doesn't support templating, so this must be set explicitly or via --set/values file. |
| siem.cluster.nodePools | list | <pre>nodePools:<br>  - component: main<br>    diskSize: "30Gi"<br>    replicas: 3<br>    roles:<br>      - "cluster_manager"<br>    resources:<br>      requests:<br>        memory: "1Gi"<br>        cpu: "500m"<br>      limits:<br>        memory: "2Gi"<br>        cpu: 1</pre> | Opensearch nodes configuration |
| siem.cluster.security.config.adminCredentialsSecret | object | `{"name":"siemadmin-credentials"}` | Secret that contains fields username and password to be used by the operator to access the opensearch cluster for node draining. Must be set if custom securityconfig is provided. |
| siem.cluster.security.config.adminSecret | object | `{"name":"opensearch-siem-admin-cert"}` | TLS Secret that contains a client certificate (tls.key, tls.crt, ca.crt) with admin rights in the opensearch cluster. Must be set if transport certificates are provided by user and not generated |
| siem.cluster.security.config.securityConfigSecret | object | `{"name":"opensearch-siem-security-config"}` | Secret that contains the differnt yml files of the opensearch-security config (config.yml, internal_users.yml, etc) |
| siem.cluster.security.tls.http.caSecret | object | `{"name":"opensearch-siem-http-cert"}` | Optional, secret that contains the ca certificate as ca.crt. If this and generate=true is set the existing CA cert from that secret is used to generate the node certs. In this case must contain ca.crt and ca.key fields |
| siem.cluster.security.tls.http.generate | bool | `false` | If set to true the operator will generate a CA and certificates for the cluster to use, if false - secrets with existing certificates must be supplied |
| siem.cluster.security.tls.http.secret | object | `{"name":"opensearch-siem-http-cert"}` | Optional, name of a TLS secret that contains ca.crt, tls.key and tls.crt data. If ca.crt is in a different secret provide it via the caSecret field |
| siem.cluster.security.tls.transport.adminDn | list | `["CN=siem-admin"]` | DNs of certificates that should have admin access, mainly used for securityconfig updates via securityadmin.sh, only used when existing certificates are provided |
| siem.cluster.security.tls.transport.caSecret | object | `{"name":"opensearch-siem-ca-cert"}` | Optional, secret that contains the ca certificate as ca.crt. If this and generate=true is set the existing CA cert from that secret is used to generate the node certs. In this case must contain ca.crt and ca.key fields |
| siem.cluster.security.tls.transport.generate | bool | `false` | If set to true the operator will generate a CA and certificates for the cluster to use, if false secrets with existing certificates must be supplied |
| siem.cluster.security.tls.transport.nodesDn | list | `["CN=opensearch-siem-transport"]` | Allowed Certificate DNs for nodes, only used when existing certificates are provided |
| siem.cluster.security.tls.transport.perNode | bool | `false` | Separate certificate per node |
| siem.cluster.security.tls.transport.secret | object | `{"name":"opensearch-siem-transport-cert"}` | Optional, name of a TLS secret that contains ca.crt, tls.key and tls.crt data. If ca.crt is in a different secret provide it via the caSecret field |
| siem.componentTemplates | list | See values.yaml | List of OpensearchComponentTemplate for SIEM cluster. |
| siem.enabled | bool | `false` | Enable or disable the SIEM OpenSearch cluster. When enabled, a second OpenSearch cluster will be deployed for SIEM. |
| siem.fullnameOverride | string | `""` |  |
| siem.indexTemplates | list | See values.yaml | List of OpensearchIndexTemplate for SIEM cluster. Includes templates for siem-logs* and siem-audit* data streams. |
| siem.ismPolicies | list | See values.yaml | List of OpenSearchISMPolicy for SIEM cluster. Includes 7-day retention policies for siem-logs* and siem-audit* indices. |
| siem.nameOverride | string | `""` | Override the name used by the subchart. By default uses release name with -siem suffix |
| siem.roles | list | See values.yaml | List of OpensearchRole for SIEM cluster. Includes write roles for siem-logs* and siem-audit* indices. |
| siem.serviceAccount.annotations | object | `{}` | Service Account annotations |
| siem.serviceAccount.create | bool | `false` | Create Service Account |
| siem.serviceAccount.name | string | `""` | Service Account name. Set `general.serviceAccount` to use this Service Account for the Opensearch cluster |
| siem.tenants | list | `[]` | List of additional tenants. Check values.yaml file for examples. |
| siem.users | list | <pre>users:<br>  - name: "siemlogs"<br>    secretName: "siemlogs-credentials"<br>    secretKey: "password"<br>    backendRoles: []<br>  - name: "siemaudit"<br>    secretName: "siemaudit-credentials"<br>    secretKey: "password"<br>    backendRoles: []</pre> | List of OpenSearch user configurations for SIEM cluster. |
| siem.usersCredentials | object | <pre>usersCredentials:<br>  siemadmin:<br>    username: "siemadmin"<br>    password: "admin"<br>    hash: ""<br>  siemlogs:<br>    username: "siemlogs"<br>    password: ""<br>  siemaudit:<br>    username: "siemaudit"<br>    password: ""</pre> | List of OpenSearch user credentials for SIEM cluster. These credentials are used for authenticating users with OpenSearch. See values.yaml file for a full example. |
| siem.usersRoleBinding | list | <pre>usersRoleBinding:<br>  - name: "siem-write"<br>    users:<br>      - "siemlogs"<br>      - "siemlogs2"<br>    roles:<br>      - "siem-write-role"<br>  - name: "siem-audit-write"<br>    users:<br>      - "siemaudit"<br>      - "siemaudit2"<br>    roles:<br>      - "siem-audit-write-role"</pre> | Allows to link any number of users, backend roles and roles with a OpensearchUserRoleBinding for SIEM cluster. Each user in the binding will be granted each role |
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
