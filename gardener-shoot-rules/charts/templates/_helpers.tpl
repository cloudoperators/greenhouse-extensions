{{/* vim: set filetype=mustache: */}}
{{/* SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors */}}
{{/* SPDX-License-Identifier: Apache-2.0 */}}

{{- define "gardener-shoot-rules.labels" -}}
plugindefinition: gardener-shoot-rules
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
release: {{ $.Release.Name | quote }}
{{- end -}}
