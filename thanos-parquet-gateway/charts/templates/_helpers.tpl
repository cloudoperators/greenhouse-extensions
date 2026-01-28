{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{- define "thanosParquetGateway.annotations" -}}
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


{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: thanosParquetGateway
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}

{{/* Base labels to be glued on everything */}}
{{- define "thanosParquetGateway.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
release: {{ $.Release.Name | quote }}
{{- end }}


{{/* Object Store Config File Name */}}
{{- define "thanosParquetGateway.objectStoreConfigFile" -}}
{{- if .Values.thanosParquetGateway.existingObjectStoreSecret.configFile -}}
{{ tpl .Values.thanosParquetGateway.existingObjectStoreSecret.configFile . }}
{{- else -}}
object-storage-configs.yaml
{{- end }}
{{- end }}