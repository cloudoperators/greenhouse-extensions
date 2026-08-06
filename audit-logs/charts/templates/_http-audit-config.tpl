{{- define "http_audit.receiver" }}
otlp/http_audit:
  protocols:
    http:
      endpoint: "0.0.0.0:{{ .Values.auditLogs.logstashExternal.http.port }}"
      auth:
        authenticator: basicauth/http_audit
      tls:
        cert_file: /tls-secret/tls.crt
        key_file: /usr/share/otelcol/config/tls.key
        min_version: "1.2"
{{- end }}


{{- define "http_audit.processors" }}
transform/http_audit:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        - merge_maps(attributes, ParseJSON(body), "upsert") where IsMatch(body, "^\\{")
        - set(attributes["sap.cc.region"], "${region}")
        - set(attributes["sap.cc.cluster"], "${cluster}")
        - set(attributes["sap.cc.audit.source"], "awx") where IsMatch(attributes["logger_name"], "awx")
        - set(attributes["sap.cc.audit.source"], attributes["event.details.serviceProvider"]) where attributes["event.details.serviceProvider"] != nil
{{- end }}


{{- define "http_audit.extension" }}
basicauth/http_audit:
  htpasswd:
    inline: |
      ${AUDIT_HTTP_USER}:${AUDIT_HTTP_PWD}
{{- end }}


{{- define "http_audit.pipeline" }}
logs/http_audit:
  receivers: [otlp/http_audit]
  processors: [transform/http_audit, attributes/cluster, batch]
  exporters: [routing]
{{- end }}
