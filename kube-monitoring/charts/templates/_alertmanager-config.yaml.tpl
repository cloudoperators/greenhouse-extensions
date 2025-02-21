- timeout: 10s
  scheme: https
{{- if and .Values.alerts.enabled .Values.alerts.alertmanagers.hosts }}
  tls_config:
{{- if and .Values.alerts.alertmanagers.tlsConfig.cert .Values.alerts.alertmanagers.tlsConfig.key }} 
    cert_file: /etc/prometheus/secrets/tls-prometheus-{{ .Release.Name }}/tls.crt
    key_file: /etc/prometheus/secrets/tls-prometheus-{{ .Release.Name }}/tls.key
{{- else }}
    cert_file: /etc/prometheus/secrets/tls-prometheus-{{ .Release.Namespace }}/tls.crt
    key_file: /etc/prometheus/secrets/tls-prometheus-{{ .Release.Namespace }}/tls.key
{{- end }}
  static_configs:
    - targets:
{{ toYaml .Values.alerts.alertmanagers.hosts | indent 8 }}
{{- end }}
