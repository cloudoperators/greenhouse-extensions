{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/*
True when any external-collector source that feeds the audit stream is enabled
(syslog, syslog-TLS, or the HTTP-JSON receiver). These share the audit
exporters/extensions/connectors/pipelines from _external-audit-exporter.tpl.
Usage: {{- if eq (include "externalCollector.auditEnabled" .) "true" }}
*/}}
{{- define "externalCollector.auditEnabled" -}}
{{- if or .Values.openTelemetry.externalCollector.syslogConfig.enabled .Values.openTelemetry.externalCollector.syslogTLSConfig.enabled .Values.openTelemetry.externalCollector.externalHttpConfig.enabled -}}
true
{{- end -}}
{{- end -}}

{{/*
True when the collector must terminate TLS with the logs-syslog-tls cert —
either syslog-TLS ingestion or the HTTP-JSON receiver's TLS is on. Both reuse
the same cert-manager Certificate.
Usage: {{- if eq (include "externalCollector.tlsEnabled" .) "true" }}
*/}}
{{- define "externalCollector.tlsEnabled" -}}
{{- if or .Values.openTelemetry.externalCollector.syslogTLSConfig.enabled (and .Values.openTelemetry.externalCollector.externalHttpConfig.enabled .Values.openTelemetry.externalCollector.externalHttpConfig.tls.enabled) -}}
true
{{- end -}}
{{- end -}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: logs
{{- if .Values.commonLabels }}
{{ tpl (toYaml .Values.commonLabels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus specific labels */}}
{{- define "plugin.prometheusLabels" }}
{{- if .Values.openTelemetry.prometheus.additionalLabels }}
{{- tpl (toYaml .Values.openTelemetry.prometheus.additionalLabels) . }}
{{- end }}
{{- if .Values.openTelemetry.prometheus.rules.labels }}
{{ tpl (toYaml .Values.openTelemetry.prometheus.rules.labels) . }}
{{- end }}
{{- end }}

{{/* Generate prometheus rule labels for alerts */}}
{{- define "plugin.additionalRuleLabels" -}}
{{- if .Values.openTelemetry.prometheus.rules.additionalRuleLabels }}
{{- tpl (toYaml .Values.openTelemetry.prometheus.rules.additionalRuleLabels) . }}
{{- end }}
{{- end }}
