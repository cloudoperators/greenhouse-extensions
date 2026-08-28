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
        # Preamble: timestamp, body parsing, SAP audit source extraction
        - set(log.time_unix_nano, log.observed_time_unix_nano)
        - merge_maps(log.attributes, ParseJSON(log.body), "upsert") where IsMatch(log.body,"^\\{")
        - set(log.attributes["sap.cc.audit.source"], log.attributes["sap"]["cc"]["audit"]["source"]) where log.attributes["sap.cc.audit.source"] == nil and log.attributes["sap"] != nil and log.attributes["sap"]["cc"] != nil and log.attributes["sap"]["cc"]["audit"] != nil and log.attributes["sap"]["cc"]["audit"]["source"] != nil
        - delete_key(log.attributes["sap"]["cc"]["audit"], "source") where log.attributes["sap.cc.audit.source"] != nil and log.attributes["sap"] != nil and log.attributes["sap"]["cc"] != nil and log.attributes["sap"]["cc"]["audit"] != nil and log.attributes["sap"]["cc"]["audit"]["source"] != nil
        - set(log.attributes["audit_relevant"], "true")
        - set(log.attributes["forwarded_by"], {{ .Values.openTelemetry.externalCollector.externalHttpConfig.forwardedBy | quote }}) where log.attributes["forwarded_by"] == nil
        - delete_matching_keys(log.attributes, "^\\.*$")
        # Field normalisation: reduce OpenSearch bloat by stringifying complex objects
        - set(log.attributes["status_string"], String(log.attributes["status"])) where log.attributes["status"] != nil
        - delete_key(log.attributes, "status") where log.attributes["status"] != nil
        - set(log.attributes["http_string"], String(log.attributes["log"]["http"])) where log.attributes["http_string"] == nil and log.attributes["log"] != nil and IsString(log.attributes["log"]) == false and log.attributes["log"]["http"] != nil
        - delete_key(log.attributes["log"], "http") where log.attributes["log"] != nil and IsString(log.attributes["log"]) == false and log.attributes["log"]["http"] != nil
        - set(log.attributes["http_string"], String(log.attributes["log.http"])) where log.attributes["http_string"] == nil and log.attributes["log.http"] != nil
        - delete_key(log.attributes, "log.http") where log.attributes["log.http"] != nil
        - set(log.attributes["http_string"], String(log.attributes["log"])) where log.attributes["http_string"] == nil and log.attributes["log"] != nil
        - delete_key(log.attributes, "log") where log.attributes["log"] != nil
        - set(log.attributes["user_agent_string"], String(log.attributes["user_agent"])) where log.attributes["user_agent"] != nil
        - delete_key(log.attributes, "user_agent") where log.attributes["user_agent"] != nil
        - set(log.attributes["auditd.paths"], String(log.attributes["auditd"]["paths"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - delete_key(log.attributes["auditd"], "paths") where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - set(log.attributes["auditd.data"], String(log.attributes["auditd"]["data"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
        - delete_key(log.attributes["auditd"], "data") where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
        - set(log.attributes["impersonatedUser_string"], String(log.attributes["impersonatedUser"])) where log.attributes["impersonatedUser"] != nil
        - delete_key(log.attributes, "impersonatedUser") where log.attributes["impersonatedUser"] != nil
        - set(log.attributes["objectRef_string"], String(log.attributes["objectRef"])) where log.attributes["objectRef"] != nil
        - delete_key(log.attributes, "objectRef") where log.attributes["objectRef"] != nil
        - delete_key(log.attributes, "syslog_timestamp") where log.attributes["syslog_timestamp"] != nil and log.time_unix_nano != 0
        # Stringify with delete_matching_keys to remove all nested/flattened subfields
        - set(log.attributes["host_string"], String(log.attributes["host"])) where log.attributes["host"] != nil
        - delete_key(log.attributes, "host") where log.attributes["host"] != nil
        - delete_matching_keys(log.attributes, "^host\\..*")
        - set(log.attributes["source_ips_string"], String(log.attributes["sourceIPs"])) where log.attributes["sourceIPs"] != nil
        - delete_key(log.attributes, "sourceIPs") where log.attributes["sourceIPs"] != nil
        - delete_matching_keys(log.attributes, "^sourceIPs\\..*")
        - set(log.attributes["event_category_string"], String(log.attributes["event.category"])) where log.attributes["event.category"] != nil
        - delete_key(log.attributes, "event.category") where log.attributes["event.category"] != nil
        - delete_matching_keys(log.attributes, "^event\\..*")
        - set(log.attributes["process_string"], String(log.attributes["process"])) where log.attributes["process"] != nil
        - delete_key(log.attributes, "process") where log.attributes["process"] != nil
        - delete_matching_keys(log.attributes, "^process\\..*")
        - set(log.attributes["prometheus_string"], String(log.attributes["prometheus"])) where log.attributes["prometheus"] != nil
        - delete_key(log.attributes, "prometheus") where log.attributes["prometheus"] != nil
        - delete_matching_keys(log.attributes, "^prometheus\\..*")
        - set(log.attributes["args_string"], String(log.attributes["args"])) where log.attributes["args"] != nil
        - delete_key(log.attributes, "args") where log.attributes["args"] != nil
        - delete_matching_keys(log.attributes, "^args\\..*")
        - set(log.attributes["user_string"], String(log.attributes["user"])) where log.attributes["user"] != nil
        - delete_key(log.attributes, "user") where log.attributes["user"] != nil
        - delete_matching_keys(log.attributes, "^user\\..*")
        - set(log.attributes["request_object_string"], String(log.attributes["requestObject"])) where log.attributes["requestObject"] != nil
        - delete_key(log.attributes, "requestObject") where log.attributes["requestObject"] != nil
        - delete_matching_keys(log.attributes, "^requestObject\\..*")
        - set(log.attributes["response_object_string"], String(log.attributes["responseObject"])) where log.attributes["responseObject"] != nil
        - delete_key(log.attributes, "responseObject") where log.attributes["responseObject"] != nil
        - delete_matching_keys(log.attributes, "^responseObject\\..*")
        - set(log.attributes["context_string"], String(log.attributes["context"])) where log.attributes["context"] != nil
        - delete_key(log.attributes, "context") where log.attributes["context"] != nil
        - delete_matching_keys(log.attributes, "^context\\..*")
        - set(log.attributes["headers_string"], String(log.attributes["headers"])) where log.attributes["headers"] != nil
        - delete_key(log.attributes, "headers") where log.attributes["headers"] != nil
        - delete_matching_keys(log.attributes, "^headers\\..*")
        - set(log.attributes["tags_string"], String(log.attributes["tags"])) where log.attributes["tags"] != nil
        - delete_key(log.attributes, "tags") where log.attributes["tags"] != nil
        - delete_matching_keys(log.attributes, "^tags\\..*")
        - set(log.attributes["tenant_ids_string"], String(log.attributes["tenant_ids"])) where log.attributes["tenant_ids"] != nil
        - delete_key(log.attributes, "tenant_ids") where log.attributes["tenant_ids"] != nil
        - delete_matching_keys(log.attributes, "^tenant_ids\\..*")
        - set(log.attributes["kubernetes_string"], String(log.attributes["kubernetes"])) where log.attributes["kubernetes"] != nil
        - delete_key(log.attributes, "kubernetes") where log.attributes["kubernetes"] != nil
        - delete_matching_keys(log.attributes, "^kubernetes\\..*")
        - set(log.attributes["service_string"], String(log.attributes["service"])) where log.attributes["service"] != nil
        - delete_key(log.attributes, "service") where log.attributes["service"] != nil
        - delete_matching_keys(log.attributes, "^service\\..*")
        - set(log.attributes["changes_string"], String(log.attributes["changes"])) where log.attributes["changes"] != nil
        - delete_key(log.attributes, "changes") where log.attributes["changes"] != nil
        - delete_matching_keys(log.attributes, "^changes\\..*")
        - set(log.attributes["summary_fields_string"], String(log.attributes["summary_fields"])) where log.attributes["summary_fields"] != nil
        - delete_key(log.attributes, "summary_fields") where log.attributes["summary_fields"] != nil
        - delete_matching_keys(log.attributes, "^summary_fields\\..*")
        - set(log.attributes["git_string"], String(log.attributes["git"])) where log.attributes["git"] != nil
        - delete_key(log.attributes, "git") where log.attributes["git"] != nil
        - delete_matching_keys(log.attributes, "^git\\..*")
        - set(log.attributes["annotations_string"], String(log.attributes["annotations"])) where log.attributes["annotations"] != nil
        - delete_key(log.attributes, "annotations") where log.attributes["annotations"] != nil
        - delete_matching_keys(log.attributes, "^annotations\\..*")
        - set(log.attributes["details_string"], String(log.attributes["Details"])) where log.attributes["Details"] != nil
        - delete_key(log.attributes, "Details") where log.attributes["Details"] != nil
        - delete_matching_keys(log.attributes, "^Details\\..*")
        - set(log.attributes["event_data_string"], String(log.attributes["event_data"])) where log.attributes["event_data"] != nil
        - delete_key(log.attributes, "event_data") where log.attributes["event_data"] != nil
        - delete_matching_keys(log.attributes, "^event_data\\..*")
        - set(log.attributes["output_fields_string"], String(log.attributes["output_fields"])) where log.attributes["output_fields"] != nil
        - delete_key(log.attributes, "output_fields") where log.attributes["output_fields"] != nil
        - delete_matching_keys(log.attributes, "^output_fields\\..*")
        - set(log.attributes["auth_string"], String(log.attributes["auth"])) where log.attributes["auth"] != nil
        - delete_key(log.attributes, "auth") where log.attributes["auth"] != nil
        - delete_matching_keys(log.attributes, "^auth\\..*")
        - set(log.attributes["response_status_string"], String(log.attributes["responseStatus"])) where log.attributes["responseStatus"] != nil
        - delete_key(log.attributes, "responseStatus") where log.attributes["responseStatus"] != nil
        - delete_matching_keys(log.attributes, "^responseStatus\\..*")
        - set(log.attributes["initiator_string"], String(log.attributes["initiator"])) where log.attributes["initiator"] != nil
        - delete_key(log.attributes, "initiator") where log.attributes["initiator"] != nil
        - delete_matching_keys(log.attributes, "^initiator\\..*")
        - set(log.attributes["target_string"], String(log.attributes["target"])) where log.attributes["target"] != nil
        - delete_key(log.attributes, "target") where log.attributes["target"] != nil
        - delete_matching_keys(log.attributes, "^target\\..*")
{{- end }}

{{/* HTTP path Kafka exporter (its own topic, separate from syslog audit). */}}
{{- define "external_http.exporter" }}
{{- if .Values.openTelemetry.auditKafka.enabled }}
kafka/external_http:
  brokers:
{{- range .Values.openTelemetry.auditKafka.brokers }}
    - {{ . }}
{{- end }}
  protocol_version: {{ .Values.openTelemetry.auditKafka.protocol_version }}
  logs:
    topic: {{ required "openTelemetry.externalCollector.externalHttpConfig.kafkaTopic is required when audit kafka is enabled" .Values.openTelemetry.externalCollector.externalHttpConfig.kafkaTopic }}
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

{{- define "external_http.pipeline" }}
logs/external-http:
  receivers: [webhookevent/external-http]
  processors:
    - memory_limiter
    - transform/external-http
    - transform/truncate_message
    - attributes/cluster
{{- if .Values.openTelemetry.auditKafka.enabled }}
  exporters: [kafka/external_http]
{{- else }}
  exporters: [failover/opensearch_syslog_audit]
{{- end }}
{{- end }}
