{{- define "perses.labels" -}}
plugindefinition: perses
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}


{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{- define "perses.pvcClaimName" -}}
{{- if contains "perses" .Release.Name -}}
provisioning-{{ .Release.Name | trunc 63 | trimSuffix "-" }}-0
{{- else -}}
provisioning-{{ printf "%s-perses" .Release.Name | trunc 63 | trimSuffix "-" }}-0
{{- end -}}
{{- end -}}

{{- define "contentSync.validate" -}}
{{- if not .Values.contentSync.image.repository }}
  {{- fail "contentSync.image.repository is required when contentSync is enabled" }}
{{- end }}
{{- if not .Values.contentSync.image.tag }}
  {{- fail "contentSync.image.tag is required when contentSync is enabled" }}
{{- end }}
{{- if not .Values.contentSync.ociImageRef }}
  {{- fail "contentSync.ociImageRef is required when contentSync is enabled" }}
{{- end }}
{{- if not .Values.perses.provisioningPersistence.enabled }}
  {{- fail "perses.provisioningPersistence.enabled must be true when contentSync is enabled" }}
{{- end }}
{{- end -}}

{{- define "perses.alertLabels" -}}
{{- if not (empty .Values.greenhouse.alertLabels) }}
{{- toYaml .Values.greenhouse.alertLabels  -}}
{{- end }}
{{- end }}

{{- define "perses.jobName" -}}
{{- if .Values.perses.fullnameOverride -}}
{{ .Values.perses.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else -}}
{{- $name := default "perses" .Values.perses.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{ .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else -}}
{{ printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end -}}
{{- end -}}
{{- end -}}
