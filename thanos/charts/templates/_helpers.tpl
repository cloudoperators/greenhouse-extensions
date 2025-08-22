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

{{/*
Renders a single `annotations:` block by merging two maps.
`overrideAnnotations` overrides `baseAnnotations` on key conflicts. Emits nothing if the merged map is empty.
*/}}
{{- define "thanos.annotations" -}}
{{- $baseAnnotations := .a | default dict -}}
{{- $overrideAnnotations := .b | default dict -}}
{{- $mergedAnnotations := merge (dict) $baseAnnotations $overrideAnnotations -}}
{{- if $mergedAnnotations -}}
annotations:
{{- toYaml $mergedAnnotations | nindent 2 }}
{{- end -}}
{{- end }}
