{{/*
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{- define "external_http.receiver" }}
webhookevent/external-http:
  endpoint: "0.0.0.0:{{ .Values.openTelemetry.externalCollector.externalHttpConfig.port }}"
  path: {{ .Values.openTelemetry.externalCollector.externalHttpConfig.path | quote }}
  health_path: {{ printf "%s/health" .Values.openTelemetry.externalCollector.externalHttpConfig.path | quote }}
  max_request_body_size: {{ .Values.openTelemetry.externalCollector.externalHttpConfig.maxRequestBodySize | int64 }}
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
        # Auditbeat sends auditd.paths (variable-length array of objects) and
        # auditd.data (open-ended map). Left as nested objects they cause
        # unbounded OpenSearch field-mapping growth (paths.0.*, paths.1.*, ...),
        # which trips "Limit of total fields [1000] has been exceeded". Collapse
        # each to a single JSON string field so it stays searchable but maps once.
        - set(log.attributes["auditd.paths"], String(log.attributes["auditd"]["paths"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - delete_key(log.attributes["auditd"], "paths") where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - set(log.attributes["auditd.data"], String(log.attributes["auditd"]["data"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
        - delete_key(log.attributes["auditd"], "data") where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
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
        # FIXME: this is a best-effort data transformation of the unknown http payloads.
        - set(log.attributes["host.name"], log.attributes["host"]) where log.attributes["host.name"] == nil and log.attributes["host"] != nil and IsString(log.attributes["host"])
        - delete_key(log.attributes, "host") where log.attributes["host.name"] != nil and log.attributes["host"] != nil and IsString(log.attributes["host"])
        - set(log.attributes["sourceIPs.0"], log.attributes["sourceIPs"]) where log.attributes["sourceIPs.0"] == nil and log.attributes["sourceIPs"] != nil and IsString(log.attributes["sourceIPs"])
        - delete_key(log.attributes, "sourceIPs") where log.attributes["sourceIPs.0"] != nil and log.attributes["sourceIPs"] != nil and IsString(log.attributes["sourceIPs"])
        - set(log.attributes["log.http"], log.attributes["log"]) where log.attributes["log.http"] == nil and log.attributes["log"] != nil and IsString(log.attributes["log"])
        - delete_key(log.attributes, "log") where log.attributes["log.http"] != nil and log.attributes["log"] != nil and IsString(log.attributes["log"])
        # Flatten nested event object into dotted event.* fields.
        - set(log.attributes["event.action"], log.attributes["event"]["action"]) where log.attributes["event"] != nil and log.attributes["event"]["action"] != nil
        - set(log.attributes["event.outcome"], log.attributes["event"]["outcome"]) where log.attributes["event"] != nil and log.attributes["event"]["outcome"] != nil
        # Collapse category to a single string field regardless of scalar or array.
        - set(log.attributes["event.category"], log.attributes["event"]["category"]) where log.attributes["event"] != nil and log.attributes["event"]["category"] != nil and IsString(log.attributes["event"]["category"])
        - set(log.attributes["event.category"], String(log.attributes["event"]["category"])) where log.attributes["event"] != nil and log.attributes["event"]["category"] != nil and not IsString(log.attributes["event"]["category"])
        - delete_key(log.attributes, "event") where log.attributes["event"] != nil
        
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
