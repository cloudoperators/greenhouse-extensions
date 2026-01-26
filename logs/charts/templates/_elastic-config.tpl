{{- define "es.labels" }}
{{ if .Values.openTelemetry.elastic.labels }}
attributes/es:
  actions:
{{- range .Values.openTelemetry.elastic.labels }}
    - action: {{ .action }}
      key: {{ .key }}
      value: {{ .value }}
{{- end }}
{{- end }}
{{- end }}

{{- define "es.volumeMounts" }}
- mountPath: /etc/otel/certs
  name: tls-secret
  readOnly: true
{{- end }}

{{- define "es.volumes" }}
- name: tls-secret
  secret:
    secretName: tls-secret
{{- end }}

{{- define "es.exporters" }}
otlp/es:
  endpoint: {{ .Values.openTelemetry.elastic.endpoint }}
  sending_queue:
    enabled: true
  tls:
    cert_file: /etc/otel/certs/tls.crt
    key_file: /etc/otel/certs/tls.key
{{- end }}

{{- define "es.pipeline" }}
logs/es:
  receivers: [forward]
  processors: [attributes/es]
  exporters: [otlp/es]
{{- end }}
