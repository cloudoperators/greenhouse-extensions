{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "selflogging.receivers" }}
otlp/self_logging:
  protocols:
    http:
      endpoint: localhost:4317

file_log/self_logging:
  include_file_path: true
{{- if .Values.auditLogs.logsCollector.selflogging.include }}
  include:
{{- range .Values.auditLogs.logsCollector.selflogging.include }}
    - {{ . }}
{{- end }}
{{- end }}
  exclude:
    - /var/log/pods/{{ .Release.Namespace }}_audit-logs-collector-*
{{- range .Values.auditLogs.logsCollector.selflogging.exclude }}
    - {{ . }}
{{- end }}
  operators:
    - id: container-parser
      type: container
    - id: parser-containerd
      type: add
      field: resource["container.runtime"]
      value: "containerd"
    - id: self-logging-label
      type: add
      field: attributes["log.type"]
      value: "self-logging"
{{- end }}

{{- define "selflogging.processors" -}}

transform/opensearch_parse:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - IsMatch(resource.attributes["k8s.pod.name"], "^opensearch-")
      statements:
        - set(log.cache["raw"], log.body) where IsString(log.body)
        - set(log.cache["parsed"], ExtractPatterns(log.cache["raw"], "^\\[(?P<timestamp>[^\\]]+)\\]\\[(?P<level>[^\\]\\s]+)\\s*\\]\\[(?P<logger>[^\\]]+?)\\s*\\]\\s*\\[(?P<node>[^\\]]+)\\]\\s*(?P<message>.*)$"))
        - set(attributes["level"], log.cache["parsed"]["level"]) where log.cache["parsed"]["level"] != nil
        - set(attributes["logger"], log.cache["parsed"]["logger"]) where log.cache["parsed"]["logger"] != nil
        - set(attributes["node"], log.cache["parsed"]["node"]) where log.cache["parsed"]["node"] != nil
        - set(log.body, log.cache["parsed"]["message"]) where log.cache["parsed"]["message"] != nil
        - set(log.time, Time(log.cache["parsed"]["timestamp"], "%Y-%m-%dT%H:%M:%S,%L")) where log.cache["parsed"]["timestamp"] != nil

transform/opensearch_operator_parse:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - IsMatch(resource.attributes["k8s.pod.name"], "^opensearch-operator")
      statements:
        - set(log.cache["parsed"], ParseJSON(log.body)) where IsMatch(log.body, "^\\{")
        - set(attributes["level"], log.cache["parsed"]["level"]) where log.cache["parsed"]["level"] != nil
        - set(attributes["logger"], log.cache["parsed"]["controller"]) where log.cache["parsed"]["controller"] != nil
        - set(attributes["reconcileID"], log.cache["parsed"]["reconcileID"]) where log.cache["parsed"]["reconcileID"] != nil
        - set(attributes["namespace"], log.cache["parsed"]["namespace"]) where log.cache["parsed"]["namespace"] != nil
        - set(log.body, log.cache["parsed"]["msg"]) where log.cache["parsed"]["msg"] != nil
        - set(log.observed_time, Time(log.cache["parsed"]["ts"], "%Y-%m- %dT%H:%M:%S.%fZ")) where log.cache["parsed"]["ts"] != nil

transform/opensearch_dashboards_parse:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - IsMatch(resource.attributes["k8s.pod.name"], "^opensearch-.*dashboards") and IsMatch(log.body, "^\\{")
      statements:
        - set(log.cache["parsed"], ParseJSON(log.body))
        - set(attributes["level"], "info")
        - set(attributes["level"], "error") where log.cache["parsed"]["type"] != nil and log.cache["parsed"]["type"] == "error"
        - set(attributes["statusCode"], log.cache["parsed"]["statusCode"]) where log.cache["parsed"]["statusCode"] != nil
        - set(attributes["level"], "warn") where log.cache["parsed"]["statusCode"] != nil and log.cache["parsed"]["statusCode"] >= 400 and log.cache["parsed"]["statusCode"] < 500
        - set(attributes["level"], "error") where log.cache["parsed"]["statusCode"] != nil and log.cache["parsed"]["statusCode"] >= 500
        - set(attributes["method"], log.cache["parsed"]["method"]) where log.cache["parsed"]["method"] != nil
        - set(attributes["level"], "warn") where log.cache["parsed"]["type"] == "log" and IsMatch(log.body, "(?i)warn")
        - set(attributes["level"], "error") where log.cache["parsed"]["type"] == "log" and IsMatch(log.body, "(?i)(error|exception|fail)")
        - set(log.body, log.cache["parsed"]["message"]) where log.cache["parsed"]["message"] != nil
        - set(log.time, Time(log.cache["parsed"]["@timestamp"], "%Y-%m-%dT%H:%M:%SZ")) where log.cache["parsed"]["@timestamp"] != nil

transform/collector_json_parse:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - IsMatch(resource.attributes["k8s.pod.name"], ".*collector.*")
      statements:
        - merge_maps(log.cache, ParseJSON(log.body), "upsert") where IsMatch(log.body, "^\\{")
        - set(attributes["level"], log.cache["level"]) where log.cache["level"] != nil

filter/less-than-error:
  error_mode: ignore
  logs:
    log_record:
      - log.severity_number < SEVERITY_NUMBER_ERROR

filter/empty-body:
  error_mode: ignore
  logs:
    log_record:
      - log.body == nil or log.body == ""

transform/severity_mapping:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        - set(log.severity_text, ToLowerCase(attributes["level"])) where IsString(attributes["level"])
        - set(log.severity_number, 1) where ToLowerCase(attributes["level"]) == "trace"
        - set(log.severity_number, 5) where ToLowerCase(attributes["level"]) == "debug"
        - set(log.severity_number, 9) where ToLowerCase(attributes["level"]) == "info"
        - set(log.severity_number, 13) where ToLowerCase(attributes["level"]) == "warn"
        - set(log.severity_number, 17) where ToLowerCase(attributes["level"]) == "error"
        - set(log.severity_number, 21) where ToLowerCase(attributes["level"]) == "fatal"

transform/kafka_parse:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - IsMatch(resource.attributes["k8s.pod.name"], "^kafka-")
      statements:
        # Extract from containerd JSON if present
        - set(log.cache["raw"], log.body) where IsString(log.body)
        # Then parse the raw message
        - set(log.cache["parsed"], ExtractPatterns(log.cache["raw"], "^(?P<timestamp>\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+(?P<level>\\w+)\\s+(?P<logger>[^:]+):(?P<line>\\d+)\\s+-\\s+(?P<message>.*)$"))
        - set(attributes["level"], log.cache["parsed"]["level"]) where log.cache["parsed"]["level"] != nil
        - set(attributes["logger"], log.cache["parsed"]["logger"]) where log.cache["parsed"]["logger"] != nil
        - set(attributes["line"], log.cache["parsed"]["line"]) where log.cache["parsed"]["line"] != nil
        - set(log.body, log.cache["parsed"]["message"]) where log.cache["parsed"]["message"] != nil

filter/kafka_drop_multiline:
  error_mode: ignore
  logs:
    log_record:
      - IsMatch(resource.attributes["k8s.pod.name"], "^kafka-") and not IsMatch(log.body, "^\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2}")
{{- end }}

{{- define "selflogging.telemetryOTLPExporter" -}}
processors:
  - batch:
      exporter:
        otlp:
          protocol: http/protobuf
          endpoint: http://localhost:4317
{{- end }}

{{- define "selflogging.attributes" -}}
attributes/self_logging:
  actions:
  - action: insert
    key: log.type
    value: self-logging
{{- end }}

{{- define "selflogging.pipelines" }}
logs/file_self_logging:
  exporters:
  - debug
  processors:
  - k8s_attributes
  - attributes/self_logging
  - attributes/cluster
  - transform/collector_json_parse
  - transform/severity_mapping
  - filter/less-than-error
  - batch
  receivers:
  - file_log/self_logging
logs/otlp_self_logging:
  receivers: 
  - otlp/self_logging
  processors: 
  - resource/self_pod
  - k8s_attributes
  - attributes/self_logging
  - attributes/cluster
  - filter/less-than-error
  - batch
  exporters: 
  - routing
{{- end }}
