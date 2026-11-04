{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: audit-logs
{{- if .Values.commonLabels }}
{{ tpl (toYaml .Values.commonLabels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus specific labels */}}
{{- define "plugin.prometheusLabels" }}
{{- if .Values.auditLogs.prometheus.additionalLabels }}
{{- tpl (toYaml .Values.auditLogs.prometheus.additionalLabels) . }}
{{- end }}
{{- if .Values.auditLogs.prometheus.rules.labels }}
{{ tpl (toYaml .Values.auditLogs.prometheus.rules.labels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus rule labels for alerts */}}
{{- define "plugin.additionalRuleLabels" -}}
{{- if and .Values.auditLogs.prometheus.rules.create .Values.auditLogs.prometheus.rules.additionalRuleLabels }}
{{- tpl (toYaml .Values.auditLogs.prometheus.rules.additionalRuleLabels) . }}
{{- end }}
{{- end }}

{{/*
Returns "true" if at least one ingester collector enables the persistent queue.
Used to gate PVC-backed-queue alerts and avoid rendering disk-usage rules when
no PVC is created by the chart.
*/}}
{{- define "auditLogs.ingesterPersistentQueueEnabled" -}}
{{- $enabled := false -}}
{{- range $name, $cfg := .Values.auditLogs.ingesterCollector.collectors -}}
{{- if and $cfg.enabled (dig "opensearch" "persistentQueue" "enabled" false $cfg) -}}
{{- $enabled = true -}}
{{- end -}}
{{- end -}}
{{- if $enabled -}}true{{- end -}}
{{- end }}

{{/*
pprof extension port (default 1777). Used by all collectors when
auditLogs.pprof.enabled is true.
*/}}
{{- define "pprof.port" -}}
{{- default 1777 (dig "pprof" "port" nil .Values.auditLogs) -}}
{{- end -}}

{{/*
pprof extension config block. Rendered inside a collector's `extensions:`
map. Call with `nindent 6`.
*/}}
{{- define "pprof.extension" -}}
pprof:
  endpoint: 0.0.0.0:{{ include "pprof.port" . }}
{{- end -}}

{{/*
pprof container port entry. Rendered inside a collector's `ports:` list.
Call with `nindent 4`.
*/}}
{{- define "pprof.containerPort" -}}
- name: pprof
  port: {{ include "pprof.port" . }}
  protocol: TCP
{{- end -}}
