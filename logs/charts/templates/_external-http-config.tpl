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
  split_as_array: true
  split_logs_at_json_boundary: false
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
        - merge_maps(log.attributes, ParseJSON(log.body), "upsert") where IsMatch(log.body,"^\\{")
        - set(log.attributes["auditd.paths"], String(log.attributes["auditd"]["paths"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - delete_key(log.attributes["auditd"], "paths") where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - set(log.attributes["auditd.data"], String(log.attributes["auditd"]["data"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
        - delete_key(log.attributes["auditd"], "data") where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
        - set(log.attributes["sap.cc.audit.source"], log.attributes["sap"]["cc"]["audit"]["source"]) where log.attributes["sap.cc.audit.source"] == nil and log.attributes["sap"] != nil and log.attributes["sap"]["cc"] != nil and log.attributes["sap"]["cc"]["audit"] != nil and log.attributes["sap"]["cc"]["audit"]["source"] != nil
        - delete_key(log.attributes["sap"]["cc"]["audit"], "source") where log.attributes["sap.cc.audit.source"] != nil and log.attributes["sap"] != nil and log.attributes["sap"]["cc"] != nil and log.attributes["sap"]["cc"]["audit"] != nil and log.attributes["sap"]["cc"]["audit"]["source"] != nil
        - set(log.attributes["audit_relevant"], "true")
        - set(log.attributes["forwarded_by"], "external-http") where log.attributes["forwarded_by"] == nil
        - set(log.attributes["tags"], String(log.attributes["tags"])) where log.attributes["tags"] != nil and not IsString(log.attributes["tags"])
        - set(log.attributes["sourceIPs"], String(log.attributes["sourceIPs"]))  where log.attributes["sourceIPs"] != nil and not IsString(log.attributes["sourceIPs"])
        - flatten(log.attributes, resolveConflicts=true)
        - delete_matching_keys(log.attributes, "^\\.*$")
        - set(log.attributes["host.name"], log.attributes["host"]) where log.attributes["host.name"] == nil and log.attributes["host"] != nil and IsString(log.attributes["host"])
        - delete_key(log.attributes, "host") where log.attributes["host.name"] != nil and log.attributes["host"] != nil and IsString(log.attributes["host"])
        - set(log.attributes["sourceIPs.0"], log.attributes["sourceIPs"]) where log.attributes["sourceIPs.0"] == nil and log.attributes["sourceIPs"] != nil and IsString(log.attributes["sourceIPs"])
        - delete_key(log.attributes, "sourceIPs") where log.attributes["sourceIPs.0"] != nil and log.attributes["sourceIPs"] != nil and IsString(log.attributes["sourceIPs"])
        - set(log.attributes["event.category.0"], log.attributes["event.category"]) where log.attributes["event.category.0"] == nil and log.attributes["event.category"] != nil and IsString(log.attributes["event.category"])
        - delete_key(log.attributes, "event.category") where log.attributes["event.category.0"] != nil and log.attributes["event.category"] != nil and IsString(log.attributes["event.category"])
        - set(log.attributes["log.http"], log.attributes["log"]) where log.attributes["log.http"] == nil and log.attributes["log"] != nil and IsString(log.attributes["log"])
        - delete_key(log.attributes, "log") where log.attributes["log.http"] != nil and log.attributes["log"] != nil and IsString(log.attributes["log"])
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
    - memory_limiter
    - transform/external-http
    - transform/truncate_message
    - attributes/cluster
{{- if .Values.openTelemetry.kafka.enabled }}
  exporters: [kafka/external_http]
{{- else }}
  exporters: [failover/opensearch_syslog_audit]
{{- end }}
{{- end }}
