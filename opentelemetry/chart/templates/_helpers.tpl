{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: opentelemetry
{{- if $.Values.prometheusRules.ruleSelectors }}
{{- range $i, $target := $.Values.prometheusRules.ruleSelectors }}
{{ $target.name | required (printf "$.Values.prometheusRules.ruleSelector.[%v].name missing" $i) }}: {{ tpl ($target.value | required (printf "$.Values.prometheusRules.ruleSelector.[%v].value missing" $i)) $ }}
{{- end }}
{{- end }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}
