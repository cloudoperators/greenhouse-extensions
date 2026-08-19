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

{{/*
Whether metrics scraping is enabled for the logs collector.
Prefers auditLogs.prometheus.serviceMonitor.enabled; falls back to the
deprecated auditLogs.prometheus.podMonitor.enabled for backward
compatibility with existing PluginPresets. Returns "true" or "".
*/}}
{{- define "auditLogs.serviceMonitorEnabled" -}}
{{- if .Values.auditLogs.prometheus.serviceMonitor.enabled -}}
true
{{- else if and .Values.auditLogs.prometheus.podMonitor .Values.auditLogs.prometheus.podMonitor.enabled -}}
true
{{- end -}}
{{- end }}

{{/*
Whether metrics scraping is enabled for the ingester collectors.
Prefers auditLogs.ingesterCollector.prometheus.serviceMonitor.enabled;
falls back to the deprecated .podMonitor.enabled. Returns "true" or "".
*/}}
{{- define "auditLogs.ingesterCollector.serviceMonitorEnabled" -}}
{{- if and .Values.auditLogs.ingesterCollector.prometheus.serviceMonitor .Values.auditLogs.ingesterCollector.prometheus.serviceMonitor.enabled -}}
true
{{- else if and .Values.auditLogs.ingesterCollector.prometheus.podMonitor .Values.auditLogs.ingesterCollector.prometheus.podMonitor.enabled -}}
true
{{- end -}}
{{- end }}

{{/* Generate prometheus rule labels for alerts */}}
{{- define "plugin.additionalRuleLabels" -}}
{{- if and .Values.auditLogs.prometheus.rules.create .Values.auditLogs.prometheus.rules.additionalRuleLabels }}
{{- tpl (toYaml .Values.auditLogs.prometheus.rules.additionalRuleLabels) . }}
{{- end }}
{{- end }}
