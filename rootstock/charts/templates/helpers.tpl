{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "rootstock.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Resolve the release name: use .Values.releaseName when set, otherwise fall back
to the Helm release name (.Release.Name).
*/}}
{{- define "rootstock.releaseName" -}}
{{- if eq .Release.Name "release-name" }}
{{- default "rootstock" .Values.releaseName }}
{{- else }}
{{- default .Release.Name .Values.releaseName }}
{{- end }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "rootstock.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name (include "rootstock.releaseName" .) }}
{{- include "rootstock.releaseName" . | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" (include "rootstock.releaseName" .) $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "rootstock.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Print the image reference. Digest takes precedence over tag; tag defaults to appVersion.
*/}}
{{- define "rootstock.image" -}}
{{- $repository := .Values.image.repository -}}
{{- $digest := .Values.image.digest -}}
{{- if $digest -}}
  {{- printf "%s@%s" $repository $digest -}}
{{- else -}}
  {{- printf "%s:%s" $repository (.Values.image.tag | default .Chart.AppVersion) -}}
{{- end -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "rootstock.labels" -}}
helm.sh/chart: {{ include "rootstock.chart" . }}
{{ include "rootstock.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "rootstock.selectorLabels" -}}
app.kubernetes.io/name: {{ include "rootstock.name" . }}
app.kubernetes.io/instance: {{ include "rootstock.releaseName" . }}
{{- end }}

{{/*
Create the name of the service account to use.
*/}}
{{- define "rootstock.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "rootstock.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Resolve the namespace: use .Values.namespace when set, otherwise fall back to
the Helm release namespace (.Release.Namespace).
*/}}
{{- define "rootstock.namespace" -}}
{{- default .Release.Namespace .Values.namespace }}
{{- end }}

{{/*
Name of the Secret that holds the Redfish password.
When redfish.existingSecret is set, use it; otherwise use the chart-rendered Secret.
*/}}
{{- define "rootstock.redfishSecretName" -}}
{{- if .Values.rootstock.redfish.existingSecret }}
{{- .Values.rootstock.redfish.existingSecret }}
{{- else }}
{{- "redfish-pdu-access" }}
{{- end }}
{{- end }}