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
{{- with .Values.additionalRuleLabels }}
{{ . | toYaml }}
{{- end -}}
{{- end -}}

{{/*
Get the logs cluster name
*/}}
{{- define "opensearch.logs-cluster-name" -}}
{{- if .Values.cluster.cluster.name }}
{{- .Values.cluster.cluster.name }}
{{- else }}
{{- printf "%s-logs" .Release.Name }}
{{- end }}
{{- end }}

{{/*
Get the SIEM cluster name
*/}}
{{- define "opensearch.siem-cluster-name" -}}
{{- if .Values.siem.cluster.name }}
{{- .Values.siem.cluster.name }}
{{- else }}
{{- printf "%s-siem" .Release.Name }}
{{- end }}
{{- end }}
