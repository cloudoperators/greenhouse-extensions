{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/*
True when the shared syslog-audit exporters/connectors/pipelines are needed.
That is: syslog or syslog-TLS is on, OR the HTTP receiver is on in non-Kafka
mode (where it reuses the OpenSearch audit failover). In Kafka mode the HTTP
receiver has its own kafka/external_http exporter and does not need these.
Usage: {{- if eq (include "externalCollector.auditEnabled" .) "true" }}
*/}}
{{- define "externalCollector.auditEnabled" -}}
{{- if or .Values.openTelemetry.externalCollector.syslogConfig.enabled .Values.openTelemetry.externalCollector.syslogHttpConfig.enabled .Values.openTelemetry.externalCollector.syslogTLSConfig.enabled (and .Values.openTelemetry.externalCollector.externalHttpConfig.enabled (not .Values.openTelemetry.auditKafka.enabled)) -}}
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
{{- if or .Values.openTelemetry.externalCollector.syslogTLSConfig.enabled (and .Values.openTelemetry.externalCollector.externalHttpConfig.enabled .Values.openTelemetry.externalCollector.externalHttpConfig.tls.enabled) (and .Values.openTelemetry.externalCollector.syslogHttpConfig.enabled .Values.openTelemetry.externalCollector.syslogHttpConfig.tls.enabled) -}}
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

{{/*
Validate an ingester opensearch duration override (timeout, retry.maxElapsedTime) and return it
in whole seconds, rounded up. Only <n>ms, <n>s or <n>m with n from 1 to 9999999 are accepted: the
collector reads a bare number as nanoseconds, and a retry budget of 0 never stops retrying.
Usage: {{ include "ingesterCollector.durationSeconds" (dict "collector" $name "key" "timeout" "value" $v) }}
*/}}
{{- define "ingesterCollector.durationSeconds" -}}
{{- $v := toString .value -}}
{{- $path := printf "openTelemetry.ingesterCollector.collectors.%s.opensearch.%s" .collector .key -}}
{{- if regexMatch "^0+(ms|s|m)?$" $v -}}
{{- fail (printf "%s: must be greater than 0, got %q" $path $v) -}}
{{- end -}}
{{- if not (regexMatch "^[1-9][0-9]{0,6}(ms|s|m)$" $v) -}}
{{- fail (printf "%s: %q is not a supported duration, use 1 to 9999999 followed by ms, s or m, e.g. 60s" $path $v) -}}
{{- end -}}
{{- $n := regexFind "^[0-9]+" $v | atoi -}}
{{- $unit := regexFind "(ms|s|m)$" $v -}}
{{- if eq $unit "ms" -}}
{{- div (add $n 999) 1000 -}}
{{- else if eq $unit "m" -}}
{{- mul $n 60 -}}
{{- else -}}
{{- $n -}}
{{- end -}}
{{- end -}}
