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
{{- range .Values.auditLogs.selflogging.include }}
    - {{ . }}
{{- end }}
  exclude:
    - /var/log/pods/fortlogs-audit_audit-logs-collector-*
{{- range .Values.auditLogs.selflogging.exclude }}
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
        - set(log.attributes["sap.cc.audit.source"], log.body["sap.cc.audit.source"]) where IsMap(log.body) and log.body["sap.cc.audit.source"] != nil
{{- end }}

{{- define "selflogging.pipelines" }}
logs/self_logging:
  receivers: [file_log/self_logging,otlp/self_logging]
  processors: [k8s_attributes,attributes/cluster,transform/self_logging,batch]
  exporters: [routing]
{{- end }}
