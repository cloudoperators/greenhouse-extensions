{{/*
Expand the name of the chart.
*/}}
{{- define "opensearch-cluster-local.name" -}}
{{- default .Chart.Name .Values.cluster.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "opensearch-cluster-local.cluster-name" -}}
{{- default .Values.cluster.cluster.name .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "opensearch-cluster-local.fullname" -}}
{{- if .Values.cluster.fullnameOverride }}
{{- .Values.cluster.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.cluster.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "opensearch-cluster-local.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "opensearch-cluster-local.labels" -}}
helm.sh/chart: {{ include "opensearch-cluster-local.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.cluster.cluster.labels }}
{{ . | toYaml }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "opensearch-cluster-local.serviceAccountName" -}}
{{- if .Values.cluster.serviceAccount.create }}
{{- default (include "opensearch-cluster-local.fullname" .) .Values.cluster.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.cluster.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "opensearch-alert-labels" -}}
{{- with .Values.cluster.cluster.general.monitoring.additionalRuleLabels }} 
{{ . | toYaml }}
{{- end -}}
{{- end -}}
