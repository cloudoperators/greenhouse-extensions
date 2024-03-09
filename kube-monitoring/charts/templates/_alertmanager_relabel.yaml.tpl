{{- if .Values.kubeMonitoring.prometheus.prometheusSpec.externalLabels }}
{{- range $key, $value := .Values.kubeMonitoring.prometheus.prometheusSpec.externalLabels }}
- action: replace
  target_label: {{ $key }}
  replacement: "{{ tpl $value $ }}"
{{- end }}
{{- end }}
