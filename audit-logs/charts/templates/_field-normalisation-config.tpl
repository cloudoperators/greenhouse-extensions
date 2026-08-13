{{- define "field_normalisation.transform" }}
transform/field-normalisation:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        # Auditbeat sends auditd.paths (variable-length array of objects) and
        # auditd.data (open-ended map). Left as nested objects they cause
        # unbounded OpenSearch field-mapping growth (paths.0.*, paths.1.*, ...),
        # which trips "Limit of total fields [1000] has been exceeded". Collapse
        # each to a single JSON string field so it stays searchable but maps once.
        - set(log.attributes["auditd.paths"], String(log.attributes["auditd"]["paths"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - delete_key(log.attributes["auditd"], "paths") where log.attributes["auditd"] != nil and log.attributes["auditd"]["paths"] != nil
        - set(log.attributes["auditd.data"], String(log.attributes["auditd"]["data"])) where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
        - delete_key(log.attributes["auditd"], "data") where log.attributes["auditd"] != nil and log.attributes["auditd"]["data"] != nil
        # FIXME: this is a best-effort data transofrmation of the unknown http payloads.
        - set(log.attributes["host.name"], log.attributes["host"]) where log.attributes["host.name"] == nil and log.attributes["host"] != nil
        - delete_key(log.attributes, "host") where log.attributes["host"] != nil
        - set(log.attributes["sourceIPs.0"], log.attributes["sourceIPs"]) where log.attributes["sourceIPs.0"] == nil and log.attributes["sourceIPs"] != nil
        - delete_key(log.attributes, "sourceIPs") where log.attributes["sourceIPs"] != nil
        - set(log.attributes["event.category.0"], log.attributes["event.category"]) where log.attributes["event.category.0"] == nil and log.attributes["event.category"] != nil
        - delete_key(log.attributes, "event.category") where log.attributes["event.category"] != nil
        - set(log.attributes["log.http"], log.attributes["log"]) where log.attributes["log.http"] == nil and log.attributes["log"] != nil
        - delete_key(log.attributes, "log") where log.attributes["log"] != nil
        
{{- end }}
