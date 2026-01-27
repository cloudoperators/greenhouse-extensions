{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: thanos-parquet-gateway
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
kube-monitoring-prometheus
{{- end }}
{{- end }}

{{/* Object Store Config File Name */}}
{{- define "thanos.objectStoreConfigFile" -}}
{{- if .Values.thanos.existingObjectStoreSecret.configFile -}}
{{ tpl .Values.thanos.existingObjectStoreSecret.configFile . }}
{{- else -}}
object-storage-configs.yaml
{{- end }}
{{- end }}

{{- define "thanos.annotations" -}}
{{- if or .base .service }}
annotations:
{{- with .base }}
{{- toYaml . | nindent 2 }}
{{- end }}
{{- with .service }}
{{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}
{{- end }}
