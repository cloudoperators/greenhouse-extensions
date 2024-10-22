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
{{- define "plugin.prometheusLabels" -}}
{{- with $.Values.openTelemetry.prometheus.additionalLabels }}
{{- tpl (toYaml . ) $ }}
{{- end }}
{{- end }}
