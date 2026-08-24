{{/*
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{/*
  ============================================================================
  Shared audit exporters, connectors, extensions and pipelines that write to
  the audit stream (OpenSearch audit-datastream, or the Kafka auditKafkaTopic).

  Two sources feed the same audit destination: the syslog audit path
  (syslogConfig / syslogTLSConfig) and the HTTP-JSON receiver
  (externalHttpConfig). Because the OpenTelemetry Collector config is a single
  flat map, both sources must reference ONE set of named components — defining
  them per-source would produce duplicate keys (e.g. two
  `failover/opensearch_syslog_audit`), which is invalid config. So these live
  here once and every enabled source includes them.

  The caller includes each helper when any audit source is on:
    syslogConfig.enabled || syslogTLSConfig.enabled || externalHttpConfig.enabled
  (see the "externalCollector.auditEnabled" helper). Kafka vs. non-Kafka
  branching is handled inside each define.
  ============================================================================
*/}}

{{/* Processors that inject the audit failover username per endpoint (non-Kafka only). */}}
{{- define "external_audit_only.processors" }}
{{- if not .Values.openTelemetry.auditKafka.enabled }}
attributes/syslog_audit_failover_username_a:
  actions:
    - action: insert
      key: failover_username_opensearch
      value: ${audit_failover_username_a}
attributes/syslog_audit_failover_username_b:
  actions:
    - action: insert
      key: failover_username_opensearch
      value: ${audit_failover_username_b}
{{- end }}
{{- end }}

{{/* basicauth extensions for the audit failover endpoints (map form, non-Kafka only). */}}
{{- define "external_audit_only.extensions" }}
{{- if not .Values.openTelemetry.auditKafka.enabled }}
basicauth/syslog_audit_failover_a:
  client_auth:
    username: ${audit_failover_username_a}
    password: ${audit_failover_password_a}
basicauth/syslog_audit_failover_b:
  client_auth:
    username: ${audit_failover_username_b}
    password: ${audit_failover_password_b}
{{- end }}
{{- end }}

{{/* service.extensions list fragment for the audit basicauth extensions (non-Kafka only). */}}
{{- define "external_audit_only.serviceExtensions" }}
{{- if not .Values.openTelemetry.auditKafka.enabled }}
- basicauth/syslog_audit_failover_a
- basicauth/syslog_audit_failover_b
{{- end }}
{{- end }}

{{/* Audit exporters: OpenSearch failover pair (non-Kafka) or kafka/syslog_audit (Kafka). */}}
{{- define "external_audit_only.exporter" }}
{{- if not .Values.openTelemetry.auditKafka.enabled }}
opensearch/failover_a_syslog_audit:
  http:
    auth:
      authenticator: basicauth/syslog_audit_failover_a
    endpoint: {{ required "openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint is required when kafka is disabled" .Values.openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint }}
  logs_index: audit-datastream
  retry_on_failure:
    enabled: true
    initial_interval: 1s
    max_interval: 5s
    max_elapsed_time: 30s
  timeout: 30s
opensearch/failover_b_syslog_audit:
  http:
    auth:
      authenticator: basicauth/syslog_audit_failover_b
    endpoint: {{ required "openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint is required when kafka is disabled" .Values.openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint }}
  logs_index: audit-datastream
  retry_on_failure:
    enabled: true
    initial_interval: 1s
    max_interval: 5s
    max_elapsed_time: 30s
  timeout: 30s
{{- else }}
kafka/syslog_audit:
  brokers:
{{- range .Values.openTelemetry.auditKafka.brokers }}
    - {{ . }}
{{- end }}
  protocol_version: {{ .Values.openTelemetry.auditKafka.protocol_version }}
  logs:
    topic: {{ required "openTelemetry.externalCollector.syslogConfig.auditKafkaTopic is required when kafka is enabled" .Values.openTelemetry.externalCollector.syslogConfig.auditKafkaTopic }}
    encoding: {{ .Values.openTelemetry.auditKafka.encoding }}
  producer:
    compression: {{ .Values.openTelemetry.auditKafka.compression }}
    max_message_bytes: {{ .Values.openTelemetry.auditKafka.max_message_bytes | int64 }}
    flush_max_messages: {{ .Values.openTelemetry.auditKafka.producer.flushMaxMessages | int64 }}
    linger: {{ .Values.openTelemetry.auditKafka.producer.linger | quote }}
  sending_queue:
    enabled: {{ .Values.openTelemetry.auditKafka.sendingQueue.enabled }}
    num_consumers: {{ .Values.openTelemetry.auditKafka.sendingQueue.numConsumers | default 1 | int64 }}
    queue_size: {{ .Values.openTelemetry.auditKafka.sendingQueue.queueSize | int64 }}
{{- if .Values.openTelemetry.auditKafka.tls.enabled }}
  tls:
    insecure: false
{{- end }}
{{- end }}
{{- end }}

{{/* Failover connector for the audit OpenSearch pair (non-Kafka only). */}}
{{- define "external_audit_only.connectors" }}
{{- if not .Values.openTelemetry.auditKafka.enabled }}
failover/opensearch_syslog_audit:
  priority_levels:
    - [logs/failover_a_syslog_audit]
    - [logs/failover_b_syslog_audit]
  retry_interval: 1h
  sending_queue:
    block_on_overflow: true
    enabled: true
    num_consumers: 2
    queue_size: 10000
    sizer: requests
{{- end }}
{{- end }}

{{/* Downstream failover pipelines so the connector has routes (non-Kafka only). */}}
{{- define "external_audit_only.pipeline" }}
{{- if not .Values.openTelemetry.auditKafka.enabled }}
logs/failover_a_syslog_audit:
  receivers: [failover/opensearch_syslog_audit]
  processors: [attributes/syslog_audit_failover_username_a]
  exporters: [opensearch/failover_a_syslog_audit]

logs/failover_b_syslog_audit:
  receivers: [failover/opensearch_syslog_audit]
  processors: [attributes/syslog_audit_failover_username_b]
  exporters: [opensearch/failover_b_syslog_audit]
{{- end }}
{{- end }}
