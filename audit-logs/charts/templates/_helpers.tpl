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
