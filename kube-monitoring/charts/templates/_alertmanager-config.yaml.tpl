- timeout: 10s
  scheme: https
{{- if and .Values.alerts.enabled .Values.alerts.alertmanagers.hosts }}
  tls_config:
    cert_file: /etc/prometheus/secrets/tls-prometheus-{{ .Release.Name }}/tls.crt
    key_file: /etc/prometheus/secrets/tls-prometheus-{{ .Release.Name }}/tls.key
  static_configs:
    - targets:
{{ toYaml .Values.alerts.alertmanagers.hosts | indent 8 }}
{{- end }}
