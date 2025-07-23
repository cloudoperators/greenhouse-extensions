{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: thanos 
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}

{{/* Base labels to be glued on everything */}}
{{- define "thanos.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
release: {{ $.Release.Name | quote }}
{{- end }}

{{/* Object Store Secret Name */}}
{{- define "thanos.objectStoreSecretName" -}}
{{- if .Values.thanos.existingObjectStoreSecret.name -}}
{{ tpl .Values.thanos.existingObjectStoreSecret.name . }}
{{- else -}}
{{ include "release.name" . }}-metrics-objectstore
{{- end }}
{{- end }}

{{/* Object Store Config File Name */}}
{{- define "thanos.objectStoreConfigFile" -}}
{{- if .Values.thanos.existingObjectStoreSecret.configFile -}}
{{ tpl .Values.thanos.existingObjectStoreSecret.configFile . }}
{{- else -}}
thanos.yaml
{{- end }}
{{- end }}