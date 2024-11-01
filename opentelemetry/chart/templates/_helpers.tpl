{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: opentelemetry
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus specific labels */}}
{{- define "plugin.prometheusLabels" }}
{{- if .Values.openTelemetry.prometheus.additionalLabels }}
{{- tpl (toYaml .Values.openTelemetry.prometheus.additionalLabels) . }}
{{- end }}
{{- if .Values.prometheusRules.labels }}
{{ tpl (toYaml .Values.prometheusRules.labels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus rule labels for alerts */}}
{{- define "plugin.additionalRuleLabels" -}}
{{- if .Values.prometheusRules.additionalRuleLabels }}
{{- tpl (toYaml .Values.prometheusRules.additionalRuleLabels) . | indent 4 }}
{{- end }}
{{- end }}