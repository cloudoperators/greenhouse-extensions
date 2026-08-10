{{/*
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{- define "external_http.receiver" }}
webhookevent/external-http:
  endpoint: "0.0.0.0:{{ .Values.openTelemetry.externalCollector.externalHttpConfig.port }}"
  path: {{ .Values.openTelemetry.externalCollector.externalHttpConfig.path | quote }}
  health_path: {{ printf "%s/health" .Values.openTelemetry.externalCollector.externalHttpConfig.path | quote }}
  split_logs_at_newline: false
{{- if .Values.openTelemetry.externalCollector.externalHttpConfig.tls.enabled }}
  tls:
    cert_file: /etc/ssl/syslog-tls/tls.crt
    key_file: /etc/ssl/syslog-tls/tls.key
{{- end }}
{{- end }}

{{- define "external_http.transform" }}
transform/external-http:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        - set(log.time_unix_nano, log.observed_time_unix_nano)
        - merge_maps(log.attributes, ParseJSON(log.body), "upsert") where IsMatch(log.body, "^\\{")
        # Flatten sender's nested [sap][cc][audit][source] into the dotted
        # attribute the audit datastream mapping expects. Only when the dotted
        # key is not already present, so a pre-flattened sender wins.
        - set(log.attributes["sap.cc.audit.source"], log.attributes["sap"]["cc"]["audit"]["source"]) where log.attributes["sap.cc.audit.source"] == nil and log.attributes["sap"] != nil and log.attributes["sap"]["cc"] != nil and log.attributes["sap"]["cc"]["audit"] != nil and log.attributes["sap"]["cc"]["audit"]["source"] != nil
        # Remove only the nested duplicate leaf; keep all other sap.* branches.
        - delete_key(log.attributes["sap"]["cc"]["audit"], "source") where log.attributes["sap.cc.audit.source"] != nil and log.attributes["sap"] != nil and log.attributes["sap"]["cc"] != nil and log.attributes["sap"]["cc"]["audit"] != nil and log.attributes["sap"]["cc"]["audit"]["source"] != nil
        # The /audit/external endpoint is contractually audit-only.
        - set(log.attributes["audit_relevant"], "true")
        # Record the forwarder identity (shipper, not producer) when absent.
        - set(log.attributes["forwarded_by"], {{ .Values.openTelemetry.externalCollector.externalHttpConfig.forwardedBy | quote }}) where log.attributes["forwarded_by"] == nil
{{- end }}

{{/* HTTP path Kafka exporter (its own topic, separate from syslog audit). */}}
{{- define "external_http.exporter" }}
{{- if .Values.openTelemetry.kafka.enabled }}
kafka/external_http:
  brokers:
{{- range .Values.openTelemetry.kafka.brokers }}
    - {{ . }}
{{- end }}
  protocol_version: {{ .Values.openTelemetry.kafka.protocol_version }}
  logs:
    topic: {{ required "openTelemetry.externalCollector.externalHttpConfig.kafkaTopic is required when kafka is enabled" .Values.openTelemetry.externalCollector.externalHttpConfig.kafkaTopic }}
    encoding: {{ .Values.openTelemetry.kafka.encoding }}
  producer:
    compression: {{ .Values.openTelemetry.kafka.compression }}
    max_message_bytes: {{ .Values.openTelemetry.kafka.max_message_bytes | int64 }}
    flush_max_messages: {{ .Values.openTelemetry.kafka.producer.flushMaxMessages | int64 }}
    linger: {{ .Values.openTelemetry.kafka.producer.linger | quote }}
  sending_queue:
    enabled: {{ .Values.openTelemetry.kafka.sendingQueue.enabled }}
    num_consumers: {{ .Values.openTelemetry.kafka.sendingQueue.numConsumers | default 1 | int64 }}
    queue_size: {{ .Values.openTelemetry.kafka.sendingQueue.queueSize | int64 }}
{{- if .Values.openTelemetry.kafka.tls.enabled }}
  tls:
    insecure: false
{{- end }}
{{- end }}
{{- end }}

{{- define "external_http.pipeline" }}
logs/external-http:
  receivers: [webhookevent/external-http]
  processors:
    - transform/external-http
    - transform/truncate_message
    - attributes/cluster
    - batch
{{- if .Values.openTelemetry.kafka.enabled }}
  exporters: [kafka/external_http]
{{- else }}
  exporters: [failover/opensearch_syslog_audit]
{{- end }}
{{- end }}
