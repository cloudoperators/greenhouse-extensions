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
        # host, sourceIPs and event.category are all polymorphic across documents:
        # sometimes a scalar string, sometimes an object (host), sometimes an array
        # (sourceIPs, event.category). Any inconsistency makes OpenSearch lock the
        # field to one type and permanently reject the other shape (e.g. existing
        # text mapping vs incoming array -> "tries to add sourceIPs.0 and refuses";
        # existing object mapping for host vs incoming scalar string).
        #
        # IMPORTANT: do NOT restructure into sub-fields (host.name, sourceIPs.0,
        # event.category.0). OpenSearch has these mapped as scalar text leaves, so
        # adding a sub-field under them is itself what triggers the conflict.
        # Instead coerce the whole value to a single JSON string in the SAME flat
        # key so it always maps once as text — same approach as auditd/log.http.
        # host, sourceIPs, event.category, process: route to generic names that can't
        # match dynamic template rules or collide with existing locked mappings.
        # ADD ANY NEW CONFLICTING FIELD HERE using the pattern: audit_<fieldname>
        - set(log.attributes["audit_host"], String(log.attributes["host"])) where log.attributes["host"] != nil
        - delete_key(log.attributes, "host") where log.attributes["host"] != nil
        - set(log.attributes["audit_source_ips"], String(log.attributes["sourceIPs"])) where log.attributes["sourceIPs"] != nil
        - delete_key(log.attributes, "sourceIPs") where log.attributes["sourceIPs"] != nil
        - set(log.attributes["audit_event_category"], String(log.attributes["event.category"])) where log.attributes["event.category"] != nil
        - delete_key(log.attributes, "event.category") where log.attributes["event.category"] != nil
        - set(log.attributes["audit_process"], String(log.attributes["process"])) where log.attributes["process"] != nil
        - delete_key(log.attributes, "process") where log.attributes["process"] != nil
        # The HTTP payload is polymorphic and would otherwise reach OpenSearch as
        # attributes.log.http in three different key shapes:
        #   1. a nested object:  attributes["log"]["http"]  (e.g. log.http.file.path)
        #   2. a flat dotted key: attributes["log.http"]
        #   3. the whole "log" object, which the exporter flattens to log.http
        # attributes.log is already mapped as an object in OpenSearch, so ANY value
        # placed under the log.* path (including log.http) is forced into that object
        # hierarchy and a concrete string is permanently rejected
        # (mapper_parsing_exception), stalling the pipeline. Instead of fighting the
        # locked log.* mapping, route the coerced value into a brand-new FLAT
        # attribute "http_string" (no dots -> no collision with the log object).
        # OpenSearch dynamically maps a never-before-seen field from its first
        # concrete value, so http_string maps cleanly as text with no rollover or
        # index-template change required.
        #
        # 1. Nested log.http child -> http_string, then drop the "log" parent.
        - set(log.attributes["http_string"], String(log.attributes["log"]["http"])) where log.attributes["http_string"] == nil and log.attributes["log"] != nil and log.attributes["log"]["http"] != nil
        - delete_key(log.attributes["log"], "http") where log.attributes["log"] != nil and log.attributes["log"]["http"] != nil
        # 2. Flat "log.http" key already present (scalar or object) -> http_string.
        - set(log.attributes["http_string"], String(log.attributes["log.http"])) where log.attributes["http_string"] == nil and log.attributes["log.http"] != nil
        - delete_key(log.attributes, "log.http") where log.attributes["log.http"] != nil
        # 3. Remaining "log" object/scalar with no http child -> http_string.
        - set(log.attributes["http_string"], String(log.attributes["log"])) where log.attributes["http_string"] == nil and log.attributes["log"] != nil
        # Drop the original "log" attribute so the exporter can never re-expand it
        # into the object-typed log.* hierarchy.
        - delete_key(log.attributes, "log") where log.attributes["log"] != nil
        # user_agent is likewise polymorphic (sometimes an object, sometimes a
        # scalar). attributes.user_agent is already mapped as object in the index,
        # so a concrete string is permanently rejected. Route to a new flat
        # attribute "user_agent_string" so OpenSearch dynamically maps it as text
        # from the first value, same approach as http_string.
        - set(log.attributes["user_agent_string"], String(log.attributes["user_agent"])) where log.attributes["user_agent"] != nil
        - delete_key(log.attributes, "user_agent") where log.attributes["user_agent"] != nil
        # Kubernetes audit fields (user, impersonatedUser, objectRef, etc.) often have
        # deeply nested structures with dotted keys (e.g. user.extra.authentication.
        # kubernetes.io/credential-id). Left as nested objects they cause polymorphic
        # type conflicts and field explosion. Stringify each large audit object to a
        # single string field, same approach as requestObject/responseObject.
        - set(log.attributes["user_string"], String(log.attributes["user"])) where log.attributes["user"] != nil
        - delete_key(log.attributes, "user") where log.attributes["user"] != nil
        - set(log.attributes["impersonatedUser_string"], String(log.attributes["impersonatedUser"])) where log.attributes["impersonatedUser"] != nil
        - delete_key(log.attributes, "impersonatedUser") where log.attributes["impersonatedUser"] != nil
        - set(log.attributes["objectRef_string"], String(log.attributes["objectRef"])) where log.attributes["objectRef"] != nil
        - delete_key(log.attributes, "objectRef") where log.attributes["objectRef"] != nil
        # requestObject and responseObject are full Kubernetes objects with unbounded
        # nesting (spec, status, containers[], volumes[], env[], ...). Left as nested
        # structures they cause OpenSearch to dynamically create hundreds of field
        # mappings (one per unique path like spec.containers.0.env.1.name), eventually
        # hitting the 1000-field index limit and permanently rejecting docs
        # ("Limit of total fields [1000] has been exceeded"). Collapse each entire
        # object to a single JSON string so it maps once as text and stays searchable
        # via substring/wildcard queries — same approach as auditd.paths/auditd.data.
        # Route to generic names that can't match any dynamic template rules targeting
        # requestObject/responseObject/labels/metadata (which may map them as flat_object).
        - set(log.attributes["k8s_req_payload"], String(log.attributes["requestObject"])) where log.attributes["requestObject"] != nil
        - delete_key(log.attributes, "requestObject") where log.attributes["requestObject"] != nil
        - set(log.attributes["k8s_resp_payload"], String(log.attributes["responseObject"])) where log.attributes["responseObject"] != nil
        - delete_key(log.attributes, "responseObject") where log.attributes["responseObject"] != nil
        # CATCH-ALL: the payload may also arrive as FLAT dotted attribute keys
        # (e.g. a key literally named "requestObject.metadata.labels.app.kubernetes.io/
        # managed-by") rather than a nested object. delete_key can't match those, so
        # use delete_matching_keys with a regex to strip every flat key under these
        # prefixes. This is what causes the recurring
        # "must be of type object but found [flat_object]" / object-mapping errors:
        # the exporter re-expands the flat dotted key into the locked object path.
        # ADD ANY NEW CONFLICTING FIELD PREFIX HERE (e.g. ^newfield\\..*).
        - delete_matching_keys(log.attributes, "^requestObject\\..*")
        - delete_matching_keys(log.attributes, "^responseObject\\..*")
        - delete_matching_keys(log.attributes, "^user\\..*")
        - delete_matching_keys(log.attributes, "^host\\..*")
        - delete_matching_keys(log.attributes, "^sourceIPs\\..*")
        - delete_matching_keys(log.attributes, "^event\\..*")
        - delete_matching_keys(log.attributes, "^process\\..*")
        
{{- end }}
