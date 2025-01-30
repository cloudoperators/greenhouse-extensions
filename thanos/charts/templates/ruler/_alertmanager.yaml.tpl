{{- define "alertmanagers.config" }}
alertmanagers:
  - scheme: https
    timeout: 10s
    api_version: v2
    {{- if .Values.thanos.ruler.alertmanagers.authentication.enabled }}
    http_config:
      tls_config:
        cert_file: /etc/thanos/secrets/thanos-ruler-{{ include "release.name" . }}-alertmanager-sso-cert/sso.crt
        key_file: /etc/thanos/secrets/thanos-ruler-{{ include "release.name" . }}-alertmanager-sso-cert/sso.key
    {{- end }}
    static_configs:
{{ toYaml .Values.thanos.ruler.alertmanagers.hosts | indent 8 }}
{{- end }}