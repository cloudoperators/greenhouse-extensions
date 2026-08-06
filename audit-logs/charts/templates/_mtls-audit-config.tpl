{{- define "mtls_audit.receiver" }}
otlp/mtls_audit:
  protocols:
    http:
      endpoint: "0.0.0.0:{{ .Values.auditLogs.logstashExternal.mtls.port }}"
      tls:
        cert_file: /tls-secret/tls.crt
        key_file: /usr/share/otelcol/config/tls.key
        client_ca_file: /tls-secret/ca.crt
        min_version: "1.2"
{{- end }}


{{- define "mtls_audit.processors" }}
transform/kube_api:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        - merge_maps(attributes, ParseJSON(body), "upsert") where IsMatch(body, "^\\{")
        - set(attributes["sap.cc.audit.source"], "kube-api")
        - set(attributes["sap.cc.cluster"], attributes["annotations.shoot.gardener.cloud/name"]) where attributes["annotations.shoot.gardener.cloud/name"] != nil
        - set(attributes["sap.cc.audit.gardener_seed"], attributes["annotations.seed.gardener.cloud/name"]) where attributes["annotations.seed.gardener.cloud/name"] != nil
        - set(time_unix_nano, UnixNano(Time(attributes["requestReceivedTimestamp"], "%Y-%m-%dT%H:%M:%S.%fZ"))) where attributes["requestReceivedTimestamp"] != nil
        - delete_key(attributes, "requestObject.metadata.managedFields")
        - delete_key(attributes, "responseObject.metadata.managedFields")
        - set(attributes["responseObject.statusText"], attributes["responseObject.status"]) where attributes["responseObject.kind"] == "Status"
        - delete_key(attributes, "responseObject.status") where attributes["responseObject.kind"] == "Status"
        - set(attributes["responseStatus.statusText"], attributes["responseStatus.status"]) where attributes["responseStatus.status"] != nil
        - delete_key(attributes, "responseStatus.status") where attributes["responseStatus.statusText"] != nil
{{- end }}


{{- define "mtls_audit.pipeline" }}
logs/mtls_audit:
  receivers: [otlp/mtls_audit]
  processors: [transform/kube_api, attributes/cluster, batch]
  exporters: [routing]
{{- end }}
