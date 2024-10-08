{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: opentelemetry 
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}