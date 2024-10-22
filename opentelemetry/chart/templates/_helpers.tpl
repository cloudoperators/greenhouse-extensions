{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: opentelemetry
{{- with $.Values.openTelemetry.prometheus.additionalLabels }}
  {{- tpl (toYaml . | nindent 4) $ }}
{{- end }}
{{- end }}
{{- end }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}
