{{/*
Expand the name of the chart.
*/}}
{{- define "plutono.name" -}}
{{- default .Chart.Name .Values.plutono.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "plutono.fullname" -}}
{{- if .Values.plutono.fullnameOverride -}}
{{- .Values.plutono.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.plutono.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "plutono.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the service account
*/}}
{{- define "plutono.serviceAccountName" -}}
{{- if .Values.plutono.serviceAccount.create -}}
    {{ default (include "plutono.fullname" .) .Values.plutono.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.plutono.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{- define "plutono.serviceAccountNameTest" -}}
{{- if .Values.plutono.serviceAccount.create -}}
    {{ default (print (include "plutono.fullname" .) "-test") .Values.plutono.serviceAccount.nameTest }}
{{- else -}}
    {{ default "default" .Values.plutono.serviceAccount.nameTest }}
{{- end -}}
{{- end -}}

{{/*
Allow the release namespace to be overridden for multi-namespace deployments in combined charts
*/}}
{{- define "plutono.namespace" -}}
  {{- if .Values.plutono.namespaceOverride -}}
    {{- .Values.plutono.namespaceOverride -}}
  {{- else -}}
    {{- .Release.Namespace -}}
  {{- end -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "plutono.labels" -}}
helm.sh/chart: {{ include "plutono.chart" . }}
{{ include "plutono.selectorLabels" . }}
{{- if or .Chart.AppVersion .Values.plutono.image.tag }}
app.kubernetes.io/version: {{ .Values.plutono.image.tag | default .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Values.plutono.extraLabels }}
{{ toYaml .Values.plutono.extraLabels }}
{{- end }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "plutono.selectorLabels" -}}
app.kubernetes.io/name: {{ include "plutono.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
{{/*
Common labels
*/}}
Return the appropriate apiVersion for rbac.
*/}}
{{- define "rbac.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "rbac.authorization.k8s.io/v1" }}
{{- print "rbac.authorization.k8s.io/v1" -}}
{{- else -}}
{{- print "rbac.authorization.k8s.io/v1beta1" -}}
{{- end -}}
{{- end -}}
