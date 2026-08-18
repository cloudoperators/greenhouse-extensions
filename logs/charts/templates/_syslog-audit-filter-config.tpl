{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{/*
  Syslog Audit/Non-Audit Filter Configuration
  Separates syslog logs into audit-relevant and non-audit streams
  for VMware infrastructure sources (ESXi, vCSA, NSX-T).

  This implements:
  1.  Early drop of known non-audit-relevant log messages (by content pattern)
  2.  Process-based audit classification (whitelist of audit-relevant processes)
  3.  Drop of specific non-audit processes (vpxd-profiler, postgres-archiver)
  4.  Drop of verbose logs
  5.  Routing of non-audit logs to a separate index
  6.  User field extraction (ESXi user, failed login user)
  7.  Hostname parsing (node name, audit source: ESXi/NSX-T/VCSA, building block)
  8.  VM event parsing (ESXi reconfigure/error events)
  9.  SSH login parsing (ESXi sshd accepted keyboard-interactive)
  10. Appname recovery from message when the receiver's ISO8601 regex_parser
      path did not populate it (fixes ESXi audit routing)

  Field mapping (syslog → OTel receiver attributes):
    The OTel syslog receiver (both rfc5424 and rfc3164) parses syslog fields
    into log record ATTRIBUTES (not body). The body retains the raw syslog line.

    message            → attributes["message"]
    process/appname    → attributes["appname"]
    hostname           → attributes["hostname"] (rfc5424) or net.peer.name (rfc3164)
    pid                → attributes["proc_id"]
    severity           → severity_number (OTel numeric severity)
    facility           → attributes["facility"]
    body               → raw syslog line as string

*/}}

{{- define "syslog_audit_filter.transform" }}
{{/*
  ============================================================================
  Extract forwarded_by attribute from message body
  Logs forwarded via Logstash have "forwarded_by=octobus_logstash" appended
  to the message. This extracts it into a proper attribute and removes it
  from the message body.
  ============================================================================
*/}}
transform/syslog_forwarded_by:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        - 'set(attributes["forwarded_by"], "octobus_logstash") where attributes["message"] != nil and IsMatch(attributes["message"], ".*forwarded_by=octobus_logstash.*")'
        - 'set(attributes["forwarded_by"], "octobus_logstash") where attributes["message"] == nil and body != nil and IsMatch(body, ".*forwarded_by=octobus_logstash.*")'
        - 'replace_pattern(attributes["message"], " forwarded_by=octobus_logstash", "") where attributes["forwarded_by"] == "octobus_logstash" and attributes["message"] != nil'
        - 'replace_pattern(body, " forwarded_by=octobus_logstash", "") where attributes["forwarded_by"] == "octobus_logstash" and body != nil'

{{/*
  ============================================================================
  Extract appname from message body
  ============================================================================
*/}}
transform/syslog_extract_appname_from_message:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "^(?P<appname>[A-Za-z0-9_.-]+):"), "upsert") where log.attributes["appname"] == nil and log.attributes["message"] != nil'

{{/*
  ============================================================================
  Semantic Convention Normalization
  Maps OTel syslog receiver legacy field names to canonical OTel semantic
  convention field names.
  Backward-compatible: legacy fields are kept, semconv fields are added.
  ============================================================================
*/}}
transform/syslog_semconv_normalization:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        # Role mapping (Collector = server, sender = client)
        # All statements are defensive: only populate semconv field if not already set.
        - 'set(attributes["server.address"], attributes["net.host.name"]) where attributes["server.address"] == nil and attributes["net.host.name"] != nil'
        - 'set(attributes["server.port"], attributes["net.host.port"]) where attributes["server.port"] == nil and attributes["net.host.port"] != nil'
        - 'set(attributes["client.address"], attributes["net.peer.name"]) where attributes["client.address"] == nil and attributes["net.peer.name"] != nil'
        - 'set(attributes["client.port"], attributes["net.peer.port"]) where attributes["client.port"] == nil and attributes["net.peer.port"] != nil'

        # Network vantage-point view
        - 'set(attributes["network.local.address"], attributes["net.host.ip"]) where attributes["network.local.address"] == nil and attributes["net.host.ip"] != nil'
        - 'set(attributes["network.peer.address"], attributes["net.peer.ip"]) where attributes["network.peer.address"] == nil and attributes["net.peer.ip"] != nil'
        - 'set(attributes["network.peer.port"], attributes["net.peer.port"]) where attributes["network.peer.port"] == nil and attributes["net.peer.port"] != nil'
        # network.transport: normalize legacy "IP.TCP"/"IP.UDP" to lowercase semconv enum values.
        # Semconv requires transport whenever a port is set (ports are ambiguous without it).
        - 'set(attributes["network.transport"], "tcp") where attributes["network.transport"] == nil and attributes["net.transport"] == "IP.TCP"'
        - 'set(attributes["network.transport"], "udp") where attributes["network.transport"] == nil and attributes["net.transport"] == "IP.UDP"'
        # Fallback: if some other value shows up, lowercase it defensively.
        - 'set(attributes["network.transport"], ConvertCase(attributes["net.transport"], "lower")) where attributes["network.transport"] == nil and attributes["net.transport"] != nil'

        # Syslog fields
        - 'set(attributes["syslog.facility.code"], Int(attributes["facility"])) where attributes["syslog.facility.code"] == nil and attributes["facility"] != nil'
        - 'set(attributes["syslog.facility.name"], attributes["facility_text"]) where attributes["syslog.facility.name"] == nil and attributes["facility_text"] != nil'

        # Resource: host identity
        # Transforms host.name from fqdn to short-name
        - 'set(resource.attributes["host.name"], attributes["hostname"]) where resource.attributes["host.name"] == nil and attributes["hostname"] != nil'
        - 'set(resource.attributes["host.name"], Split(resource.attributes["host.name"], ".")[0]) where resource.attributes["host.name"] != nil and IsString(resource.attributes["host.name"]) and IsMatch(resource.attributes["host.name"], ".*\\..*") and IsMatch(resource.attributes["host.name"], ".*[A-Za-z].*")'
        - 'replace_pattern(resource.attributes["host.name"], ":", "") where resource.attributes["host.name"] != nil and IsString(resource.attributes["host.name"]) and IsMatch(resource.attributes["host.name"], ".*:.*")'

{{/*
  ============================================================================
  Legacy Field Cleanup
  Drops legacy OTel field names after semconv normalization has populated
  their canonical replacements. Guards ensure a legacy key is only removed
  once its semconv counterpart has been successfully set.
  ============================================================================
*/}}
transform/syslog_drop_legacy_fields:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        # Role / address / port mappings
        - 'delete_key(attributes, "net.host.name") where attributes["server.address"] != nil'
        - 'delete_key(attributes, "net.host.port") where attributes["server.port"] != nil'
        - 'delete_key(attributes, "net.peer.name") where attributes["client.address"] != nil'
        - 'delete_key(attributes, "net.peer.port") where attributes["client.port"] != nil and attributes["network.peer.port"] != nil'

        # Network vantage-point
        - 'delete_key(attributes, "net.host.ip") where attributes["network.local.address"] != nil'
        - 'delete_key(attributes, "net.peer.ip") where attributes["network.peer.address"] != nil'
        - 'delete_key(attributes, "net.transport") where attributes["network.transport"] != nil'

        # Syslog fields
        - 'delete_key(attributes, "facility") where attributes["syslog.facility.code"] != nil'
        - 'delete_key(attributes, "facility_text") where attributes["syslog.facility.name"] != nil'

        # Resource-mapped: hostname → resource.host.name
        - 'delete_key(attributes, "hostname") where resource.attributes["host.name"] != nil'

{{/*
  ============================================================================
  Early drop of non-audit-relevant messages
  ============================================================================
*/}}
filter/syslog_early_drop:
  error_mode: ignore
  logs:
    log_record:
      # Drop messages containing "ProtocolEndpoint::GetPEInfo"
      - 'IsMatch(attributes["message"], ".*ProtocolEndpoint::GetPEInfo.*")'
      # Drop messages containing "--> SCSI PE, ID"
      - 'IsMatch(attributes["message"], ".*--> SCSI PE, ID.*")'
      # Drop whitespace-only messages
      - 'attributes["message"] == " "'
      # Drop single bracket messages
      - 'attributes["message"] == "]"'
      # Drop _vmx_log[digits]: pattern
      - 'IsMatch(attributes["message"], ".*_vmx_log\\[\\d+\\]:.*")'
      # Drop informational VVold messages (severity_number 9 = INFO2 in OTel)
      - 'severity_number == SEVERITY_NUMBER_INFO and IsMatch(attributes["message"], ".*VVold:.*")'
      # Drop informational Hostd VVOLLIB messages
      - 'severity_number == SEVERITY_NUMBER_INFO and IsMatch(attributes["message"], ".*Hostd:.*VVOLLIB.*")'
      # Drop informational vc* sps|rsyslogd messages
      - 'severity_number == SEVERITY_NUMBER_INFO and IsMatch(attributes["message"], ".*vc\\S+\\s(sps|rsyslogd).*")'
      # Drop warning sub=VigorStatsProvider messages (severity_number 13 = WARN in OTel)
      - 'severity_number == SEVERITY_NUMBER_WARN and IsMatch(attributes["message"], ".*sub=VigorStatsProvider.*")'

{{/*
  ============================================================================
  Drop verbose logs
  ============================================================================
*/}}
filter/syslog_drop_verbose:
  error_mode: ignore
  logs:
    log_record:
      - 'IsMatch(attributes["message"], ".*: verbose .*")'

{{/*
  ============================================================================
  Drops: vpxd-profiler, postgres-archiver
  ============================================================================
*/}}
filter/syslog_drop_non_audit_processes:
  error_mode: ignore
  logs:
    log_record:
      - 'IsMatch(attributes["appname"], "(?i)^(vpxd-profiler|postgres-archiver):?$")'

{{/*
  ============================================================================
  User extraction from syslog message
  ============================================================================
*/}}
transform/syslog_user_extraction:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        # Extract "user=xyz]" pattern
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "user=(?P<syslog_user>[^\\]]+)\\]"), "upsert") where log.attributes["message"] != nil'
        # Extract "for user xyz from" pattern (fallback if user not already found)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "for user (?P<syslog_user>.*?) from"), "upsert") where log.attributes["syslog_user"] == nil and log.attributes["message"] != nil'
    # Failed/Cannot login parsing - only for Hostd, vobd, vpxd processes
    - context: log
      conditions:
        - 'IsMatch(log.attributes["appname"], "(?i)^(Hostd|vobd|vpxd):?$")'
      statements:
        # Match userid in format <userid>@<domain>
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?(?P<syslog_user>[a-zA-Z0-9._-]+)@"), "upsert") where log.attributes["syslog_user"] == nil and log.attributes["message"] != nil'
        # Match userid in format <domain>\<userid>
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?(?:\\S+)\\\\(?P<syslog_user>\\S+)"), "upsert") where log.attributes["syslog_user"] == nil and log.attributes["message"] != nil'
        # Match simple userid (fallback)
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?%{USERNAME:syslog_user}", true), "upsert") where log.attributes["syslog_user"] == nil and log.attributes["message"] != nil'

{{/*
  ============================================================================
  Hostname parsing - extract node name, audit source, building block
  ============================================================================
*/}}
transform/syslog_hostname_parsing:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        # Extract ESXi node name pattern: node### or nodeswift## followed by more hostname chars
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["hostname"], "(?P<node_nodename>node(\\d{3}|swift\\d{2})[a-zA-Z0-9.-]+)"), "upsert") where log.attributes["hostname"] != nil'
        # Fallback: try net.peer.name if hostname attribute is not set (common for RFC3164)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["net.peer.name"], "(?P<node_nodename>node(\\d{3}|swift\\d{2})[a-zA-Z0-9.-]+)"), "upsert") where log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil'
        # Set audit source to ESXi if node name was extracted
        - 'set(log.attributes["sap.cc.audit.source"], "ESXi") where log.attributes["node_nodename"] != nil'
        # NSX-T hostname detection (nsx-ctl*) - check both hostname and net.peer.name
        - 'set(log.attributes["sap.cc.audit.source"], "NSX-T") where log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], "nsx-ctl.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "NSX-T") where log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and IsMatch(log.attributes["net.peer.name"], "nsx-ctl.*")'
        # VCSA hostname detection (vc-*) - check both hostname and net.peer.name
        - 'set(log.attributes["sap.cc.audit.source"], "VCSA") where log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], "vc-.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "VCSA") where log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and IsMatch(log.attributes["net.peer.name"], "vc-.*")'
        # STNPA source detection from appname prefix (do not overwrite an existing source)
        - 'set(log.attributes["sap.cc.audit.source"], "stnpa") where log.attributes["sap.cc.audit.source"] == nil and log.attributes["appname"] != nil and IsMatch(log.attributes["appname"], "(?i)^stnpa")'
        # Extract building block from hostname (for ESXi and NSX-T)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["hostname"], "(?P<node_building_block>bb\\d{3})"), "upsert") where log.attributes["hostname"] != nil and (log.attributes["sap.cc.audit.source"] == "ESXi" or log.attributes["sap.cc.audit.source"] == "NSX-T")'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["net.peer.name"], "(?P<node_building_block>bb\\d{3})"), "upsert") where log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and (log.attributes["sap.cc.audit.source"] == "ESXi" or log.attributes["sap.cc.audit.source"] == "NSX-T")'

{{/*
  ============================================================================
  NSX-T FQDN extraction - extract NSX-T transport-node FQDN from message
  ============================================================================
*/}}
transform/syslog_nsxt:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'log.attributes["sap.cc.audit.source"] == "NSX-T"'
      statements:
        # Extract NSX-T transport-node FQDN (shape: node###-bb###.<domain>).
        # Handles both message encodings: free-text "Transport node X (" and JSON "transport_node_name":"X".
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(?P<fqdn>node\\d{3}-bb\\d{3}\\.\\S+?)(?:[\\s\\)\"]|$)"), "upsert") where log.attributes["fqdn"] == nil and log.attributes["message"] != nil'
        # Extract username: prefer Username= value inside LdapUserDetailsImpl wrapper
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Username=(?P<syslog_user>[^@]+)@"), "upsert") where log.attributes["syslog_user"] == nil and log.attributes["message"] != nil'
        # Extract audit operation fields
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "ModuleName=\"(?P<nsx_module>[^\"]+)\""), "upsert") where log.attributes["message"] != nil'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Operation=\"(?P<nsx_operation>[^\"]+)\""), "upsert") where log.attributes["message"] != nil'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Operation status=\"(?P<nsx_operation_status>[^\"]+)\""), "upsert") where log.attributes["message"] != nil'

{{/*
  ============================================================================
  ESXi VM event parsing
  ============================================================================
*/}}
transform/syslog_esxi_vm_events:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'log.attributes["sap.cc.audit.source"] == "ESXi"'
      statements:
        # Parse VM reconfigure/error events
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "Event %{NONNEGINT:event_id} : (?:Reconfigured|Error message on) %{DATA:cloud_instance_name} \\(%{UUID:cloud_instance_id}\\)%{GREEDYDATA}", true), "upsert")'

{{/*
  ============================================================================
  ESXi SSH login parsing
  ============================================================================
*/}}
transform/syslog_esxi_sshd:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'log.attributes["sap.cc.audit.source"] == "ESXi"'
        - 'log.attributes["appname"] == "sshd"'
        - 'IsMatch(log.attributes["message"], ".*Accepted keyboard-interactive/pam for root from.*")'
      statements:
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "%{WORD:sshd_application}\\[%{NUMBER:sshd_process_id}\\]: %{WORD:sshd_status} %{DATA:sshd_auth_method} for %{USERNAME:sshd_user} from %{IP:sshd_ip} port %{NUMBER:sshd_port} %{WORD:sshd_protocol}", true), "upsert")'

{{/*
  ============================================================================
  Adds an attribute to identify audit logs for routing.
  Audit-relevant processes: Hostd, NSX, procstate, shell, sshd, ssoAudit, vpxd, ssoadminserver, sudo
  Also marks any log with a known audit source (sap.cc.audit.source) as audit-relevant.
  Everything else is non-audit (and goes to logs-datastream).
  ============================================================================
*/}}
transform/syslog_audit_classification:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        # Default: mark as non-audit (most logs are non-audit)
        - 'set(log.attributes["audit_relevant"], "false")'
        # Mark as audit if process IS in the audit-relevant whitelist
        - 'set(log.attributes["audit_relevant"], "true") where log.attributes["appname"] != nil and IsMatch(log.attributes["appname"], "(?i)^(Hostd|NSX|procstate|shell|sshd|ssoAudit|vpxd|ssoadminserver|sudo):?$")'
        # Mark as audit if the log has a known audit source (e.g. ESXi, NSX-T, VCSA)
        - 'set(log.attributes["audit_relevant"], "true") where log.attributes["sap.cc.audit.source"] != nil'
        # Mark network logs as audit-relevant
        - 'set(log.attributes["audit_relevant"], "true") where body != nil and IsMatch(body, "(?i)(ise-idc|Check Point|Fortinet|Palo Alto Networks|TrendMicro|Tufin)")'
# Uses observedTimestamp as fallback when no timestamp could be parsed from the log body
# (e.g. unknown format logs that end up with @timestamp = 1970-01-01T00:00:00Z)
transform/syslog_observed_timestamp_fallback:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'time_unix_nano == 0'
      statements:
        - 'set(time_unix_nano, observed_time_unix_nano)'
{{- end }}

{{- define "syslog_audit_filter.connectors" }}
{{/*
  ============================================================================
  Routing connector: separates audit from non-audit syslog logs
  Audit logs go to audit-datastream, non-audit logs go to logs-datastream
  ============================================================================
*/}}
{{- if not .Values.openTelemetry.kafka.enabled }}
routing/syslog_audit:
  default_pipelines: [logs/syslog_non_audit]
  error_mode: ignore
  table:
    - context: log
      pipelines: [logs/syslog_audit]
      statement: route() where attributes["audit_relevant"] == "true"

failover/opensearch_syslog_non_audit:
  priority_levels:
    - [logs/failover_a_syslog_non_audit]
    - [logs/failover_b_syslog_non_audit]
  retry_interval: 1h
  sending_queue:
    block_on_overflow: true
    enabled: true
    num_consumers: 2
    queue_size: 10000
    sizer: requests
{{- else }}
routing/syslog_audit:
  default_pipelines: [logs/syslog_non_audit]
  error_mode: ignore
  table:
    - context: log
      pipelines: [logs/syslog_audit]
      statement: route() where attributes["audit_relevant"] == "true"
{{- end }}
{{- end }}

{{- define "syslog_audit_filter.exporter" }}
{{- if not .Values.openTelemetry.kafka.enabled }}
opensearch/failover_a_syslog_non_audit:
  http:
    auth:
      authenticator: basicauth/failover_a
    endpoint: {{ required "openTelemetry.externalCollector.syslogConfig.openSearchLogs.nonAuditEndpoint is required when kafka is disabled" .Values.openTelemetry.externalCollector.syslogConfig.openSearchLogs.nonAuditEndpoint }}
  logs_index: logs-datastream
  retry_on_failure:
    enabled: true
    initial_interval: 1s
    max_interval: 5s
    max_elapsed_time: 30s
  timeout: 30s
opensearch/failover_b_syslog_non_audit:
  http:
    auth:
      authenticator: basicauth/failover_b
    endpoint: {{ required "openTelemetry.externalCollector.syslogConfig.openSearchLogs.nonAuditEndpoint is required when kafka is disabled" .Values.openTelemetry.externalCollector.syslogConfig.openSearchLogs.nonAuditEndpoint }}
  logs_index: logs-datastream
  retry_on_failure:
    enabled: true
    initial_interval: 1s
    max_interval: 5s
    max_elapsed_time: 30s
  timeout: 30s
{{- else }}
kafka/syslog_non_audit:
  brokers:
{{- range .Values.openTelemetry.kafka.brokers }}
    - {{ . }}
{{- end }}
  protocol_version: {{ .Values.openTelemetry.kafka.protocol_version }}
  logs:
    topic: {{ required "openTelemetry.externalCollector.syslogConfig.nonAuditKafkaTopic is required when kafka is enabled" .Values.openTelemetry.externalCollector.syslogConfig.nonAuditKafkaTopic }}
    encoding: {{ .Values.openTelemetry.kafka.encoding }}
  producer:
    compression: {{ .Values.openTelemetry.kafka.compression }}
    max_message_bytes: {{ .Values.openTelemetry.kafka.max_message_bytes | int64 }}
    flush_max_messages: {{ .Values.openTelemetry.kafka.producer.flushMaxMessages | int64 }}
    linger: {{ .Values.openTelemetry.kafka.producer.linger | quote }}
  sending_queue:
    enabled: {{ .Values.openTelemetry.kafka.sendingQueue.enabled }}
    num_consumers: {{ .Values.openTelemetry.kafka.sendingQueue.numConsumers | default 1 | int64 }}
    queue_size: {{ .Values.openTelemetry.kafka.sendingQueue.queueSize | int64 }}
{{- if .Values.openTelemetry.kafka.tls.enabled }}
  tls:
    insecure: false
{{- end }}
{{- end }}
{{- end }}

{{- define "syslog_audit_filter.pipeline" }}
{{/*
  ============================================================================
  Pipeline definitions for audit/non-audit syslog routing
  Audit logs → audit-datastream
  Non-audit logs → logs-datastream
  ============================================================================
*/}}
{{- if not .Values.openTelemetry.kafka.enabled }}
logs/failover_a_syslog_non_audit:
  receivers: [failover/opensearch_syslog_non_audit]
  processors: [attributes/failover_username_a]
  exporters: [opensearch/failover_a_syslog_non_audit]

logs/failover_b_syslog_non_audit:
  receivers: [failover/opensearch_syslog_non_audit]
  processors: [attributes/failover_username_b]
  exporters: [opensearch/failover_b_syslog_non_audit]

{{- end }}
# Audit-relevant syslog logs → audit index
logs/syslog_audit:
  receivers: [routing/syslog_audit]
  processors: [batch]
{{- if .Values.openTelemetry.kafka.enabled }}
  exporters: [kafka/syslog_audit]
{{- else }}
  exporters: [failover/opensearch_syslog_audit]
{{- end }}

# Non-audit syslog logs → logs index
logs/syslog_non_audit:
  receivers: [routing/syslog_audit]
  processors: [filter/syslog_drop_non_audit_processes, batch]
{{- if .Values.openTelemetry.kafka.enabled }}
  exporters: [kafka/syslog_non_audit]
{{- else }}
  exporters: [failover/opensearch_syslog_non_audit]
{{- end }}
{{- end }}
