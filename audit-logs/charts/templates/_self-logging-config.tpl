{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "selflogging.receivers" }}
otlp/self_logging:
  protocols:
    grpc:
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

{{- define "selflogging.telemetryOTLPExporter" -}}
processors:
  - batch:
      exporter:
        otlp:
          protocol: http/protobuf
          endpoint: http://localhost:4317
{{- end }}



{{- define "selflogging.pipelines" }}
logs/self_logging:
  receivers: [file_log/self_logging,otlp/self_logging]
  processors: [k8s_attributes,attributes/cluster,batch]
  exporters: [routing]
{{- end }}
