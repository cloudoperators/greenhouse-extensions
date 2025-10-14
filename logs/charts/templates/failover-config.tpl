{{- define "failover.attributes" }}
attributes/failover_username_b:
  actions:
    - action: insert
      key: failover_username_opensearch
      value: ${failover_username_b}
{{- end }}

{{- define "failover.exporter" }}
opensearch/failover_b:
  http:
    auth:
      authenticator: basicauth/failover_b
    endpoint: {{ .Values.openTelemetry.openSearchLogs.endpoint }}
  logs_index: ${index}-datastream
  retry_on_failure:
    enabled: true
    max_elapsed_time: 0s
  sending_queue:
    enabled: true
    queue_size: 100000
    num_consumers: 2
    block_on_overflow: true
  timeout: 30s
{{- end }}

{{- define "failover.extension" }}
basicauth/failover_b:
  client_auth:
    username: ${failover_username_b}
    password: ${failover_password_b}
{{- end }}

{{- define "failover.pipeline" }}
logs/failover_b:
    receivers: [failover]
    processors: [attributes/failover_username_b]
    exporters: [opensearch/failover_b]
{{- end }}
