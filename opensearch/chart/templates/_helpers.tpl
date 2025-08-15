{{/*
Common labels for opensearch resources
*/}}
{{- define "opensearch.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.cluster.cluster.labels }}
{{ . | toYaml }}
{{- end }}
{{- end }}

{{- define "opensearch-alert-labels" -}}
{{- with .Values.cluster.cluster.general.monitoring.additionalRuleLabels }}
{{ . | toYaml }}
{{- end -}}
{{- end -}}
