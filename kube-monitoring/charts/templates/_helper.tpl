{{/* vim: set filetype=mustache: */}}

{{- define "kube-prometheus-stack.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
The components in this chart create additional resources that expand the longest created name strings.
The longest name that gets created adds and extra 37 characters, so truncation should be 63-35=26.
*/}}
{{- define "kube-prometheus-stack.fullname" -}}
{{- printf "%s" $.Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "kube-state-metrics.fullname" -}}
{{- printf "%s-%s" $.Release.Name "kube-state-metrics" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "prometheus-node-exporter.fullname" -}}
{{- printf "%s-%s" $.Release.Name "node-exporter" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "prometheus-blackbox-exporter.fullname" -}}
{{- printf "%s-%s" $.Release.Name "blackbox-exporter" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Generate basic labels */}}
{{ define "kube-prometheus-stack.labels" }}
plugindefinition: kube-monitoring
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
release: {{ $.Release.Name | quote }}
{{- end }}

{{/*
Generate basic labels
*/}}
{{- define "kube-state-metrics.labels" }}
plugindefinition: kube-monitoring
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
helm.sh/chart: {{ template "kube-state-metrics.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: metrics
app.kubernetes.io/part-of: {{ template "kube-state-metrics.name" . }}
{{- include "kube-state-metrics.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- if .Values.customLabels }}
{{ tpl (toYaml .Values.customLabels) . }}
{{- end }}
{{- if .Values.releaseLabel }}
release: {{ .Release.Name }}
{{- end }}
{{- end }}

{{/*
Common node-exporter labels
*/}}
{{- define "prometheus-node-exporter.labels" -}}
plugindefinition: kube-monitoring
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
helm.sh/chart: {{ include "prometheus-node-exporter.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: metrics
app.kubernetes.io/part-of: {{ include "prometheus-node-exporter.name" . }}
{{ include "prometheus-node-exporter.selectorLabels" . }}
{{- with .Chart.AppVersion }}
app.kubernetes.io/version: {{ . | quote }}
{{- end }}
{{- with .Values.commonLabels }}
{{ tpl (toYaml .) $ }}
{{- end }}
{{- if .Values.releaseLabel }}
release: {{ .Release.Name }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "prometheus-blackbox-exporter.labels" -}}
plugindefinition: kube-monitoring
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
helm.sh/chart: {{ include "prometheus-blackbox-exporter.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: metrics
app.kubernetes.io/part-of: {{ include "prometheus-blackbox-exporter.name" . }}
{{ include "prometheus-blackbox-exporter.selectorLabels" . }}
{{- with .Chart.AppVersion }}
app.kubernetes.io/version: {{ . | quote }}
{{- end }}
{{- with .Values.podLabels }}
{{ toYaml . }}
{{- end }}
{{- if .Values.releaseLabel }}
release: {{ .Release.Name }}
{{- end }}
{{- end }}

{{/* Generate basic labels */}}
{{- define "kubeMonitoring.dashboardSelectorLabels" }}
{{- if $.Values.kubeMonitoring.dashboards.plutonoSelectors }}
{{- range $i, $target := $.Values.kubeMonitoring.dashboards.plutonoSelectors }}
{{ $target.name | required (printf "$.Values.kubeMonitoring.dashboards.plutonoSelectors.[%v].name missing" $i) }}: {{ tpl ($target.value | required (printf "$.Values.Monitoring.dashboards.plutonoSelectors.[%v].value missing" $i)) $ }}
{{- end }}
{{- end }}
{{- end }}

{{- define "kubeMonitoring.persesDashboardSelectorLabels" }}
{{- if $.Values.kubeMonitoring.dashboards.persesSelectors }}
{{- range $i, $target := $.Values.kubeMonitoring.dashboards.persesSelectors }}
{{ $target.name | required (printf "$.Values.kubeMonitoring.dashboards.persesSelectors.[%v].name missing" $i) }}: {{ tpl ($target.value | required (printf "$.Values.Monitoring.dashboards.persesSelectors.[%v].value missing" $i)) $ }}
{{- end }}
{{- end }}
{{- end }}
