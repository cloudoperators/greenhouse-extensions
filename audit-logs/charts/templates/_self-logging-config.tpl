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
filter/less-than-warn:
  error_mode: propagate
  logs:
    log_record:
      - severity_number < SEVERITY_NUMBER_WARN
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
  receivers: [file_log/self_logging]
  processors: [k8s_attributes,attributes/self_logging,attributes/cluster,batch]
  exporters: [routing]
logs/otlp_self_logging:
  receivers: [otlp/self_logging]
  processors: [filter/less-than-warn,resource/self_pod,k8s_attributes,attributes/self_logging,attributes/cluster,batch]
  exporters: [routing]
{{- end }}
