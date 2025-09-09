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

{{/* Generate basic labels */}}
{{ define "kube-prometheus-stack.labels" }}
plugindefinition: alerts
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
release: {{ $.Release.Name | quote }}
{{- end }}

{{- define "alerts.dashboardSelectorLabels" }}
{{- $path := index . 0 -}}
{{- $root := index . 1 -}}
plugin: {{ $root.Release.Name }}
{{- if $root.Values.alerts.dashboards.plutonoSelectors }}
{{- range $i, $target := $root.Values.alerts.dashboards.plutonoSelectors }}
{{ $target.name | required (printf "$.Values.alerts.dashboards.plutonoSelectors.[%v].name missing" $i) }}: {{ tpl ($target.value | required (printf "$.Values.alerts.dashboards.plutonoSelectors.[%v].value missing" $i)) $ }}
{{- end }}
{{- end }}
{{- end }}
