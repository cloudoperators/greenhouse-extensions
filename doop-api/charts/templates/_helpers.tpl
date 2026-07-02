{{/*
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "doop-api.labels" -}}
app.kubernetes.io/name: doop-api
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: api
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "doop-api.selectorLabels" -}}
app.kubernetes.io/name: doop-api
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: api
{{- end -}}

{{- define "doop-api.image" -}}
{{- $repo := .Values.image.repository | required ".Values.image.repository is required" -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- printf "%s:%s" $repo $tag -}}
{{- end -}}
