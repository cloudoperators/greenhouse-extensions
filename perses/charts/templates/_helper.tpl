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


{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{- define "perses.alertLabels" -}}
{{- if not (empty .Values.greenhouse.alertLabels) }}
{{- toYaml .Values.greenhouse.alertLabels  -}}
{{- end }}
{{- end }}