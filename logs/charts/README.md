# logs

![Version: 0.16.38](https://img.shields.io/badge/Version-0.16.38-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.161.0](https://img.shields.io/badge/AppVersion-0.161.0-informational?style=flat-square)

OpenTelemetry Operator Helm chart for Kubernetes

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| timojohlo |  |  |
| kuckkuck |  |  |
| olandr |  |  |
| joluc |  |  |

## Source Code

* <https://github.com/cloudoperators/greenhouse-extensions>

## Requirements

| Repository | Name | Version |
|------------|------|---------|
|  | crds | 0.0.5 |
| https://open-telemetry.github.io/opentelemetry-helm-charts | opentelemetry-operator | 0.126.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| commonLabels | object | `{}` | common labels to apply to all resources. |
| customCRDs.enabled | bool | `true` | The required CRDs used by this dependency are version-controlled in this repository under ./charts/crds. |
| extraManifests | list | `[]` | Extra Kubernetes manifests to include in the Helm release. Each entry is rendered as-is (map) or with `tpl` (string). Useful for ConfigMaps that satisfy cluster admission policies. |
| openTelemetry.auditKafka | object | See values.yaml | Audit Kafka exporter configuration shared by all collectors |
| openTelemetry.auditKafka.brokers | list | `[]` | Kafka broker addresses (e.g., ["kafka-bootstrap.kafka.svc.cluster.local:9092"]) |
| openTelemetry.auditKafka.compression | string | `""` | Compression type (none, gzip, snappy, lz4, zstd) |
| openTelemetry.auditKafka.enabled | bool | `false` | Enable Kafka exporter (replaces OpenSearch failover with Kafka buffering) |
| openTelemetry.auditKafka.encoding | string | `""` | Message encoding format (otlp_json, otlp_proto, raw) |
| openTelemetry.auditKafka.max_fetch_size | int | `1048576` | Consumer max bytes per fetch request (ingester). Match producer max_message_bytes for large records. |
| openTelemetry.auditKafka.max_message_bytes | int | `1048576` | Max producer message size in bytes before compression. Raise to match the Kafka topic/broker max.message.bytes. |
| openTelemetry.auditKafka.max_partition_fetch_size | int | `1048576` | Consumer max bytes fetched per partition (ingester). Match producer max_message_bytes for large records. |
| openTelemetry.auditKafka.producer | object | `{"flushMaxMessages":10000,"linger":"10ms"}` | Producer batching (raise linger to build larger batches per broker request) |
| openTelemetry.auditKafka.protocol_version | string | `""` | Kafka protocol version (e.g., "3.9.0") |
| openTelemetry.auditKafka.sendingQueue | object | `{"enabled":true,"numConsumers":1,"queueSize":1000}` | Producer sending queue size |
| openTelemetry.auditKafka.sendingQueue.numConsumers | int | `1` | Parallel export workers draining the queue to Kafka. Raise toward the topic partition count for higher throughput. |
| openTelemetry.auditKafka.tls | object | `{"caSecret":"","caSecretKey":"","enabled":false}` | TLS configuration for Kafka connections |
| openTelemetry.auditKafka.tls.caSecret | string | `""` | K8s secret name containing CA certificate that can be used to verify the identity of the Kafka brokers. (e.g. kafka-audit-cluster-ca-cert) |
| openTelemetry.auditKafka.tls.caSecretKey | string | `""` | K8s secret key which holds the CA certificate. (e.g. ca.crt) |
| openTelemetry.auditKafka.tls.enabled | bool | `false` | Enable TLS for Kafka connections |
| openTelemetry.auditKafka.users | list | See values.yaml | Users configuration for Audit Kafka connections |
| openTelemetry.cluster | string | `nil` | Cluster label for Logging |
| openTelemetry.collectorImage | object | `{"repository":"ghcr.io/cloudoperators/opentelemetry-collector-contrib","tag":"45a549e"}` | OpenTelemetry Collector image configuration |
| openTelemetry.collectorImage.repository | string | `"ghcr.io/cloudoperators/opentelemetry-collector-contrib"` | Image repository for OpenTelemetry Collector |
| openTelemetry.collectorImage.tag | string | `"45a549e"` | Image tag for OpenTelemetry Collector |
| openTelemetry.customLabels | object | `{}` | custom Labels applied to servicemonitor, secrets and collectors |
| openTelemetry.externalCollector | object | See values.yaml | Standalone external OTel Collector as StatefulSet. |
| openTelemetry.externalCollector.affinity | object | `{}` | Pod affinity rules for the external collector CR |
| openTelemetry.externalCollector.calicoLoadBalancerIP | bool | `false` | Enable Calico projectcalico.org/loadBalancerIPs annotation for the external IP |
| openTelemetry.externalCollector.enabled | bool | `false` | Enables the standalone external OTel Collector StatefulSet and its PodMonitor. |
| openTelemetry.externalCollector.externalConfig | object | `{"alertmanager_port":1515,"deployments_port":1516,"enabled":false}` | Activates the external alertmanager webhook and deployment event receivers. |
| openTelemetry.externalCollector.externalConfig.alertmanager_port | int | `1515` | Port for alertmanager webhook events |
| openTelemetry.externalCollector.externalConfig.deployments_port | int | `1516` | Port for deployment TCP log events |
| openTelemetry.externalCollector.externalHttpConfig | object | `{"auditKafkaBrokers":[],"enabled":false,"forwardedBy":"external-http","kafkaTopic":"audit","maxRequestBodySize":10485760,"path":"/audit/external","port":1517,"tls":{"enabled":true}}` | HTTP-JSON receiver for Logstash/fluent-bit-style pushers. In Kafka mode records go to externalHttpConfig.kafkaTopic; in non-Kafka mode to the syslog audit OpenSearch failover (audit-datastream). |
| openTelemetry.externalCollector.externalHttpConfig.auditKafkaBrokers | list | `[]` | Audit kafka brokers list used by external http kafka exporter. |
| openTelemetry.externalCollector.externalHttpConfig.forwardedBy | string | `"external-http"` | Neutral catch-all forwarder identity written to log attribute `forwarded_by` ONLY when the sender did not set one. Senders (Logstash, logshipper fluent-bit, other devices) should set their own `forwarded_by` and it is preserved. Sender-provided sap.cc.audit.source values (ESXi, NSX-T, VCSA, remoteboard, hsm, ucsc) are also preserved. |
| openTelemetry.externalCollector.externalHttpConfig.kafkaTopic | string | `"audit"` | Kafka topic for the HTTP records (Kafka mode only). Separate from syslog audit, which uses syslogConfig.auditKafkaTopic. |
| openTelemetry.externalCollector.externalHttpConfig.maxRequestBodySize | int | `10485760` | Max request body size in bytes. Requests larger than this get HTTP 400. Default 10 MiB. |
| openTelemetry.externalCollector.externalHttpConfig.path | string | `"/audit/external"` | HTTP path the receiver serves. Sender must POST here. |
| openTelemetry.externalCollector.externalHttpConfig.port | int | `1517` | TCP port for the HTTP-JSON receiver. |
| openTelemetry.externalCollector.externalHttpConfig.tls | object | `{"enabled":true}` | TLS for the HTTP-JSON receiver. When enabled, the collector terminates TLS using the cert provisioned by syslogTLSConfig (secret logs-syslog-tls); requires syslogTLSConfig.dnsName / .issuerName. |
| openTelemetry.externalCollector.externalIP | string | `nil` | External IP exposed on the service |
| openTelemetry.externalCollector.externalTrafficPolicy | string | `"Local"` | External traffic policy for the external collector service (Local preserves source IP) |
| openTelemetry.externalCollector.kafkaTopic | string | `""` | Kafka topic name for external logs — alerts, deployments, syslog (e.g., "logs-external") |
| openTelemetry.externalCollector.kafkaTracesTopic | string | `""` | Kafka topic name for traces (e.g., "traces") |
| openTelemetry.externalCollector.maxMessageLength | int | `32000` | Max bytes for the log body on the external audit paths (truncate_message processor). Body is a text field so this can be large. Raise to match Kafka message/fetch size. |
| openTelemetry.externalCollector.nodeSelector | string | `""` | Node selector for the external collector LoadBalancer service, as an OpenStack `loadbalancer.openstack.org/node-selector` |
| openTelemetry.externalCollector.replicas | int | `2` | Number of replicas for the external collector StatefulSet |
| openTelemetry.externalCollector.resources | object | `{}` | Pod resource requests/limits for the external collector container. Empty = unbounded. |
| openTelemetry.externalCollector.serviceAnnotations | object | `{}` | Additional annotations on the external Service |
| openTelemetry.externalCollector.serviceType | string | `"LoadBalancer"` | Service type for the external collector service |
| openTelemetry.externalCollector.syslogConfig | object | `{"auditKafkaBrokers":[],"auditKafkaTopic":"","enabled":false,"nonAuditKafkaTopic":"","openSearchLogs":{"auditEndpoint":"","audit_failover_password_a":"","audit_failover_password_b":"","audit_failover_username_a":"","audit_failover_username_b":"","nonAuditEndpoint":""},"tcp_port":514,"udp_port":514}` | Activates syslog TCP/UDP ingestion (rfc5424/rfc3164). |
| openTelemetry.externalCollector.syslogConfig.auditKafkaBrokers | list | `[]` | Audit kafka brokers list used by syslog kafka exporter. |
| openTelemetry.externalCollector.syslogConfig.auditKafkaTopic | string | `""` | Kafka topic for audit-relevant syslog logs (only used when kafka is enabled) |
| openTelemetry.externalCollector.syslogConfig.nonAuditKafkaTopic | string | `""` | Kafka topic for non-audit syslog logs (only used when kafka is enabled) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs | object | `{"auditEndpoint":"","audit_failover_password_a":"","audit_failover_password_b":"","audit_failover_username_a":"","audit_failover_username_b":"","nonAuditEndpoint":""}` | OpenSearch configuration for syslog logs |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint | string | `""` | OpenSearch endpoint for audit-relevant syslog logs |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_password_a | string | `""` | Password for primary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_password_b | string | `""` | Password for secondary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_username_a | string | `""` | Username for primary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.audit_failover_username_b | string | `""` | Username for secondary failover OpenSearch endpoint (audit) |
| openTelemetry.externalCollector.syslogConfig.openSearchLogs.nonAuditEndpoint | string | `""` | OpenSearch endpoint for non-audit syslog logs |
| openTelemetry.externalCollector.syslogConfig.tcp_port | int | `514` | TCP port for syslog (rfc5424) |
| openTelemetry.externalCollector.syslogConfig.udp_port | int | `514` | UDP port for syslog (rfc3164) |
| openTelemetry.externalCollector.syslogHttpConfig | object | `{"enabled":false,"maxRequestBodySize":10485760,"path":"/syslog/external","port":1518,"tls":{"enabled":true}}` | HTTP receiver that ingests JSON-array syslog batches (webhookevent). Feeds the same audit / non-audit pipeline as tcp_log/syslog. |
| openTelemetry.externalCollector.syslogHttpConfig.maxRequestBodySize | int | `10485760` | Max request body size in bytes. Requests larger than this get HTTP 400. Default 10 MiB. |
| openTelemetry.externalCollector.syslogHttpConfig.path | string | `"/syslog/external"` | HTTP path the receiver serves. Sender must POST here. |
| openTelemetry.externalCollector.syslogHttpConfig.port | int | `1518` | TCP port for the HTTP receiver. |
| openTelemetry.externalCollector.syslogHttpConfig.tls | object | `{"enabled":true}` | TLS for the HTTP receiver. When enabled, the collector terminates TLS using the cert provisioned by syslogTLSConfig (secret logs-syslog-tls); requires syslogTLSConfig.dnsName / .issuerName. |
| openTelemetry.externalCollector.syslogTLSConfig | object | `{"clientCAEnabled":false,"dnsName":null,"enabled":false,"issuerGroup":"cert-manager.io","issuerKind":"ClusterIssuer","issuerName":null,"tcp_port":6514}` | Activates syslog TCP with TLS ingestion (rfc5424). |
| openTelemetry.externalCollector.syslogTLSConfig.clientCAEnabled | bool | `false` | Enable client CA verification (mTLS). Requires a ca.crt key in the TLS secret. |
| openTelemetry.externalCollector.syslogTLSConfig.dnsName | string | `nil` | DNS name for the TLS certificate |
| openTelemetry.externalCollector.syslogTLSConfig.issuerGroup | string | `"cert-manager.io"` | cert-manager issuer group (e.g. cert-manager.io or certmanager.cloud.sap) |
| openTelemetry.externalCollector.syslogTLSConfig.issuerKind | string | `"ClusterIssuer"` | cert-manager issuer kind (Issuer or ClusterIssuer) |
| openTelemetry.externalCollector.syslogTLSConfig.issuerName | string | `nil` | cert-manager Issuer or ClusterIssuer name for TLS certificate |
| openTelemetry.externalCollector.syslogTLSConfig.tcp_port | int | `6514` | TCP port for TLS syslog (rfc5424) |
| openTelemetry.externalCollector.tracesConfig | object | `{"enabled":false,"otlp_grpc_port":4317,"otlp_http_port":4318}` | Activates OTLP traces ingestion (gRPC and HTTP). |
| openTelemetry.externalCollector.tracesConfig.otlp_grpc_port | int | `4317` | gRPC port for OTLP traces |
| openTelemetry.externalCollector.tracesConfig.otlp_http_port | int | `4318` | HTTP port for OTLP traces |
| openTelemetry.ingesterCollector | object | see values.yaml | Kafka -> OpenSearch ingest collectors. One Deployment per entry. |
| openTelemetry.ingesterCollector.affinity | object | `{}` | Pod affinity rules for the ingester collector CRs |
| openTelemetry.ingesterCollector.collectors | object | `{}` | Map of ingest collectors keyed by name. Configured via PluginPreset. |
| openTelemetry.ingesterCollector.enabled | bool | `false` | Enable the ingest collectors block. |
| openTelemetry.ingesterCollector.image.repository | string | `""` | Image repository override; falls back to openTelemetry.collectorImage.repository. |
| openTelemetry.ingesterCollector.image.tag | string | `""` | Image tag override; falls back to openTelemetry.collectorImage.tag. |
| openTelemetry.ingesterCollector.prometheus.podMonitor.enabled | bool | `true` | Render a PodMonitor per enabled ingest collector. |
| openTelemetry.ingesterCollector.replicas | int | `3` | Replica count per ingest collector Deployment. |
| openTelemetry.ingesterCollector.resources | object | `{}` | Pod resources per ingest collector Deployment. |
| openTelemetry.kafka | object | See values.yaml | Kafka exporter configuration shared by all collectors |
| openTelemetry.kafka.brokers | list | `[]` | Kafka broker addresses (e.g., ["kafka-bootstrap.kafka.svc.cluster.local:9092"]) |
| openTelemetry.kafka.compression | string | `""` | Compression type (none, gzip, snappy, lz4, zstd) |
| openTelemetry.kafka.enabled | bool | `false` | Enable Kafka exporter (replaces OpenSearch failover with Kafka buffering) |
| openTelemetry.kafka.encoding | string | `""` | Message encoding format (otlp_json, otlp_proto, raw) |
| openTelemetry.kafka.max_fetch_size | int | `1048576` | Consumer max bytes per fetch request (ingester). Match producer max_message_bytes for large records. |
| openTelemetry.kafka.max_message_bytes | int | `1048576` | Max producer message size in bytes before compression. Raise to match the Kafka topic/broker max.message.bytes. |
| openTelemetry.kafka.max_partition_fetch_size | int | `1048576` | Consumer max bytes fetched per partition (ingester). Match producer max_message_bytes for large records. |
| openTelemetry.kafka.producer | object | `{"flushMaxMessages":10000,"linger":"10ms"}` | Producer batching (raise linger to build larger batches per broker request) |
| openTelemetry.kafka.protocol_version | string | `""` | Kafka protocol version (e.g., "3.9.0") |
| openTelemetry.kafka.sendingQueue | object | `{"enabled":true,"numConsumers":1,"queueSize":1000}` | Producer sending queue size |
| openTelemetry.kafka.sendingQueue.numConsumers | int | `1` | Parallel export workers draining the queue to Kafka. Raise toward the topic partition count for higher throughput. |
| openTelemetry.kafka.tls | object | `{"caSecret":"","caSecretKey":"","enabled":false}` | TLS configuration for Kafka connections |
| openTelemetry.kafka.tls.caSecret | string | `""` | K8s secret name containing CA certificate that can be used to verify the identity of the Kafka brokers. (e.g. kafka-cluster-ca-cert) |
| openTelemetry.kafka.tls.caSecretKey | string | `""` | K8s secret key which holds the CA certificate. (e.g. ca.crt) |
| openTelemetry.kafka.tls.enabled | bool | `false` | Enable TLS for Kafka connections |
| openTelemetry.kafka.users | list | See values.yaml | Users configuration for Kafka connections |
| openTelemetry.logsCollector.affinity | object | See values.yaml | Pod affinity rules for the logs collector CR |
| openTelemetry.logsCollector.batch | object | `{"sendBatchMaxSize":5000,"sendBatchSize":100,"timeout":"30s"}` | Batch processor settings for the logs collector. |
| openTelemetry.logsCollector.batch.sendBatchMaxSize | int | `5000` | Hard cap on records per batch. |
| openTelemetry.logsCollector.batch.sendBatchSize | int | `100` | Flush when this many records are buffered (raise for larger downstream batches). |
| openTelemetry.logsCollector.batch.timeout | string | `"30s"` | Flush after this duration regardless of size. |
| openTelemetry.logsCollector.cephConfig | object | `{"enabled":false}` | Activates the configuration for Ceph logs (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.containerdConfig | object | `{"enabled":true,"exclude":[]}` | Activates the containerd file log receiver (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.containerdConfig.exclude | list | `[]` | Paths to exclude from the containerd ingestion. |
| openTelemetry.logsCollector.enabled | bool | `true` | Activates the standard configuration for Logs. |
| openTelemetry.logsCollector.journaldConfig | object | `{"enabled":true}` | Activates the journald receiver (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.k8seventsConfig | object | `{"enabled":true}` | Activates the k8s events receiver (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.kafkaStorageTopic | string | `""` | Kafka topic name for storage logs — swift, ceph (e.g., "logs-storage") |
| openTelemetry.logsCollector.kafkaTopic | string | `""` | Kafka topic name for general logs (e.g., "logs") |
| openTelemetry.logsCollector.kvmConfig | object | `{"enabled":false}` | Activates the configuration for KVM logs (requires logsCollector to be enabled). |
| openTelemetry.logsCollector.maxMessageLength | int | `32000` | Max characters for the log body in the truncate_message processor. Keep below the Lucene 32766-byte term limit so OpenSearch never permanently rejects a document. |
| openTelemetry.logsCollector.openstackConfig | object | `{"enabled":false}` | Activates the configuration for OpenStack logs (requires logsCollector to be enabled). |
| openTelemetry.metricsCollector | object | `{"affinity":{},"enabled":false}` | Activates the standard configuration for metrics. |
| openTelemetry.metricsCollector.affinity | object | `{}` | Pod affinity rules for the metrics collector CR |
| openTelemetry.openSearchLogs.endpoint | string | `nil` | Endpoint URL for OpenSearch |
| openTelemetry.openSearchLogs.failover_password_a | string | `nil` | Password for OpenSearch endpoint |
| openTelemetry.openSearchLogs.failover_password_b | string | `nil` | Second Password (as a failover) for OpenSearch endpoint |
| openTelemetry.openSearchLogs.failover_username_a | string | `nil` | Username for OpenSearch endpoint |
| openTelemetry.openSearchLogs.failover_username_b | string | `nil` | Second Username (as a failover) for OpenSearch endpoint |
| openTelemetry.prometheus.additionalLabels | object | `{}` | Label selectors for the Prometheus resources to be picked up by prometheus-operator. |
| openTelemetry.prometheus.podMonitor | object | `{"enabled":true}` | Activates the pod-monitoring for the Logs Collector. |
| openTelemetry.prometheus.rules | object | `{"additionalRuleLabels":null,"annotations":{},"create":true,"enabled":["ReceiverRefusedLogs","ReconcileErrors","ReceiverRefusedMetric","WorkqueueDepth","OTelLogsMissing","OTelLogsIncreasing","OTelLogsDecreasing","OTelLogsSLOBurnRateCritical","OTelLogsSLOBurnRateWarning","OTelLogsExportFailureRatioHigh","OTelExporterQueueFull","ExternalCollectorMemoryHigh"],"labels":{}}` | Default rules for monitoring the opentelemetry components. |
| openTelemetry.prometheus.rules.additionalRuleLabels | string | `nil` | Additional labels for PrometheusRule alerts. |
| openTelemetry.prometheus.rules.annotations | object | `{}` | Annotations for PrometheusRules. |
| openTelemetry.prometheus.rules.create | bool | `true` | Enables PrometheusRule resources to be created. |
| openTelemetry.prometheus.rules.enabled | list | `["ReceiverRefusedLogs","ReconcileErrors","ReceiverRefusedMetric","WorkqueueDepth","OTelLogsMissing","OTelLogsIncreasing","OTelLogsDecreasing","OTelLogsSLOBurnRateCritical","OTelLogsSLOBurnRateWarning","OTelLogsExportFailureRatioHigh","OTelExporterQueueFull","ExternalCollectorMemoryHigh"]` | PrometheusRules to enable. |
| openTelemetry.prometheus.rules.labels | object | `{}` | Labels for PrometheusRules. |
| openTelemetry.prometheus.serviceMonitor | object | `{"enabled":true}` | Activates the service-monitoring for the Logs Collector. |
| openTelemetry.region | string | `nil` | Region label for Logging |
| opentelemetry-operator.admissionWebhooks.autoGenerateCert | object | `{"recreate":false}` | Activate to use Helm to create self-signed certificates. |
| opentelemetry-operator.admissionWebhooks.autoGenerateCert.recreate | bool | `false` | Activate to recreate the cert after a defined period (certPeriodDays default is 365). |
| opentelemetry-operator.admissionWebhooks.certManager | object | `{"enabled":false}` | Activate to use the CertManager for generating self-signed certificates. |
| opentelemetry-operator.admissionWebhooks.failurePolicy | string | `"Ignore"` | Defines if the admission webhooks should `Ignore` errors or `Fail` on errors when communicating with the API server. |
| opentelemetry-operator.admissionWebhooks.pods.namespaceSelector | object | `{"matchExpressions":[{"key":"opentelemetry.io/auto-instrumentation","operator":"In","values":["enabled"]}]}` | Workloads that need OpenTelemetry auto-instrumentation must label their namespace |
| opentelemetry-operator.crds.create | bool | `false` | If you want to use the upstream CRDs, set this variable to `true``. |
| opentelemetry-operator.enabled | bool | `true` | Set to true to enable the installation of the OpenTelemetry Operator. |
| opentelemetry-operator.manager.image.repository | string | `"ghcr.io/open-telemetry/opentelemetry-operator/opentelemetry-operator"` | overrides the default image repository for the OpenTelemetry Operator image. |
| opentelemetry-operator.manager.serviceMonitor.enabled | bool | `true` | Enable serviceMonitor for Prometheus metrics scrape |
| opentelemetry-operator.manager.serviceMonitor.extraLabels | object | `{}` | Additional labels on the ServiceMonitor |
| testFramework.enabled | bool | `true` | Activates the Helm chart testing framework. |
| testFramework.image.registry | string | `"ghcr.io"` | Defines the image registry for the test framework. |
| testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` | Defines the image repository for the test framework. |
| testFramework.image.tag | string | `"main"` | Defines the image tag for the test framework. |
| testFramework.imagePullPolicy | string | `"IfNotPresent"` | Defines the image pull policy for the test framework. |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
