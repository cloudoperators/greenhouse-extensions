{{- define "perses.labels" -}}
plugindefinition: perses
plugin: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
perses.dev/resource: "true"
release: {{ .Release.Name | quote }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}