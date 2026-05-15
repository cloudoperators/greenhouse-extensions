{{/*
Common labels for kafka resources
*/}}
{{- define "kafka.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
plugindefinition: kafka
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Prometheus rule labels for alerts
*/}}
{{- define "kafka.alert-labels" -}}
{{- with .Values.monitoring.additionalRuleLabels }}
{{ toYaml . }}
{{- end -}}
{{- end -}}

{{/*
Generate plugin specific labels
*/}}
{{- define "plugin.labels" -}}
plugindefinition: kafka
{{- if .Values.commonLabels }}
{{ tpl (toYaml .Values.commonLabels) . }}
{{- end }}
{{- end }}
