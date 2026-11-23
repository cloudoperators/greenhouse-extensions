{{/*
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{/*
Writes logs to one JSON file per UTC day, grouped by fileexporter.path_segment.
*/}}

{{- define "fileExporter.volumeMount" -}}
- name: file-exporter
  mountPath: /var/lib/otel-file-exporter
{{- end }}

{{- define "fileExporter.volume" -}}
- name: file-exporter
  hostPath:
    path: {{ required "fileExporter.hostPath is required when the file exporter is enabled" .Values.openTelemetry.logsCollector.fileExporter.hostPath }}
    type: DirectoryOrCreate
{{- end }}

{{- define "fileExporter.processor" -}}
transform/file_date:
  error_mode: ignore
  log_statements:
    - context: resource
      statements:
        - set(resource.attributes["fileexporter.path_segment"], FormatTime(Now(), "%Y-%m-%d"))
{{- end }}

{{- define "fileExporter.exporter" -}}
{{- $cfg := .Values.openTelemetry.logsCollector.fileExporter }}
file:
  path: /var/lib/otel-file-exporter/{{ $cfg.fileName }}-*.json
  create_directory: true
  group_by:
    enabled: true
    resource_attribute: fileexporter.path_segment
  rotation:
    max_megabytes: {{ $cfg.rotation.maxMegabytes | int64 }}
    max_days: {{ $cfg.rotation.maxDays | int64 }}
    max_backups: {{ $cfg.rotation.maxBackups | int64 }}
{{- end }}
