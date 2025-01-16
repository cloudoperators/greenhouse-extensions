{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: audit-opentelemetry
{{- if .Values.commonLabels }}
{{ tpl (toYaml .Values.commonLabels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus specific labels */}}
{{- define "plugin.prometheusLabels" }}
{{- if .Values.auditOpenTelemetry.prometheus.additionalLabels }}
{{- tpl (toYaml .Values.auditOpenTelemetry.prometheus.additionalLabels) . }}
{{- end }}
{{- if .Values.auditOpenTelemetry.prometheus.rules.labels }}
{{ tpl (toYaml .Values.auditOpenTelemetry.prometheus.rules.labels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus rule labels for alerts */}}
{{- define "plugin.additionalRuleLabels" -}}
{{- if .Values.auditOpenTelemetry.prometheus.rules.additionalRuleLabels }}
{{- tpl (toYaml .Values.auditOpenTelemetry.prometheus.rules.additionalRuleLabels) . }}
{{- end }}
{{- end }}