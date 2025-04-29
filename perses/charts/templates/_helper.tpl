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

{{- define "alerts.additionalRuleLabels" -}}
{{- if not (empty .Values.greenhouse.prometheus.alerts.additionalRuleLabels) }}
{{ tpl (toYaml .Values.greenhouse.prometheus.alerts.additionalRuleLabels) . }}
{{- end }}
{{- end }}