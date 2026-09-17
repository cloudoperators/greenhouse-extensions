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
  include:
{{- range .Values.auditLogs.logsCollector.selflogging.include }}
    - {{ . }}
{{- end }}
  exclude:
    - /var/log/pods/fortlogs-audit_audit-logs-collector-*
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

{{- define "selflogging.processors" }}
transform/self_logging:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        - set(log.attributes["fortlogs.source"], log.body["fortlogs.source"]) where IsMap(log.body) and log.body["fortlogs.source"] != nil
        - set(log.attributes["fortlogs.component"], log.body["fortlogs.component"]) where IsMap(log.body) and log.body["fortlogs.component"] != nil
    - context: log
      conditions:
        - IsMatch(resource.attributes["app.label.component"], "kafka")
      statements:
        - set(log.attributes["fortlogs.source"], "kafka") where log.attributes["fortlogs.source"] == nil
        - set(log.attributes["fortlogs.component"], "kafka") where log.attributes["fortlogs.component"] == nil
    - context: log
      conditions:
        - IsMatch(resource.attributes["app.label.component"], "opensearch")
      statements:
        - set(log.attributes["fortlogs.source"], "opensearch") where log.attributes["fortlogs.source"] == nil
        - set(log.attributes["fortlogs.component"], "opensearch") where log.attributes["fortlogs.component"] == nil
{{- end }}

{{- define "selflogging.telemetryOTLPExporter" -}}
exporters:
  - otlp:
      protocol: grpc/protobuf
      endpoint: localhost:4317
{{- end }}



{{- define "selflogging.pipelines" }}
logs/self_logging:
  receivers: [file_log/self_logging,otlp/self_logging]
  processors: [k8s_attributes,attributes/cluster,transform/self_logging,batch]
  exporters: [routing]
{{- end }}
