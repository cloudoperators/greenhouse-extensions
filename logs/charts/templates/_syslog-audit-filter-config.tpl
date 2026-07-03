{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{/*
  Syslog Audit/Non-Audit Filter Configuration
  Separates syslog logs into audit-relevant and non-audit streams
  for VMware infrastructure sources (ESXi, vCSA, NSX-T).

  This implements:
  1. Early drop of known non-audit-relevant log messages (by content pattern)
  2. Process-based audit classification (whitelist of audit-relevant processes)
  3. Drop of specific non-audit processes (vpxd-profiler, postgres-archiver)
  4. Drop of verbose logs
  5. Routing of non-audit logs to a separate index
  6. User field extraction (ESXi user, failed login user)
  7. Hostname parsing (node name, audit source: ESXi/NSX-T/VCSA, building block)
  8. VM event parsing (ESXi reconfigure/error events)
  9. SSH login parsing (ESXi sshd accepted keyboard-interactive)

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
{{- if not .Values.openTelemetry.kafka.enabled }}
attributes/syslog_audit_failover_username_a:
  actions:
    - action: insert
      key: failover_username_opensearch
      value: ${audit_failover_username_a}
attributes/syslog_audit_failover_username_b:
  actions:
    - action: insert
      key: failover_username_opensearch
      value: ${audit_failover_username_b}
{{- end }}
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
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "user=(?P<syslog_user>[^\\]]+)\\]"), "upsert")'
        # Extract "for user xyz from" pattern (fallback if user not already found)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "for user (?P<syslog_user>.*?) from"), "upsert") where log.attributes["syslog_user"] == nil'
    # Failed/Cannot login parsing - only for Hostd, vobd, vpxd processes
    - context: log
      conditions:
        - 'IsMatch(log.attributes["appname"], "(?i)^(Hostd|vobd|vpxd):?$")'
      statements:
        # Match userid in format <userid>@<domain>
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?(?P<syslog_user>[a-zA-Z0-9._-]+)@"), "upsert") where log.attributes["syslog_user"] == nil'
        # Match userid in format <domain>\<userid>
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?(?:\\S+)\\\\(?P<syslog_user>\\S+)"), "upsert") where log.attributes["syslog_user"] == nil'
        # Match simple userid (fallback)
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?%{USERNAME:syslog_user}", true), "upsert") where log.attributes["syslog_user"] == nil'

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
        - 'set(log.attributes["audit_source"], "ESXi") where log.attributes["node_nodename"] != nil'
        # NSX-T hostname detection (nsx-ctl*) - check both hostname and net.peer.name
        - 'set(log.attributes["audit_source"], "NSX-T") where log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], "nsx-ctl.*")'
        - 'set(log.attributes["audit_source"], "NSX-T") where log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and IsMatch(log.attributes["net.peer.name"], "nsx-ctl.*")'
        # VCSA hostname detection (vc-*) - check both hostname and net.peer.name
        - 'set(log.attributes["audit_source"], "VCSA") where log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], "vc-.*")'
        - 'set(log.attributes["audit_source"], "VCSA") where log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and IsMatch(log.attributes["net.peer.name"], "vc-.*")'
        # Extract building block from hostname (for ESXi and NSX-T)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["hostname"], "(?P<node_building_block>bb\\d{3})"), "upsert") where log.attributes["hostname"] != nil and (log.attributes["audit_source"] == "ESXi" or log.attributes["audit_source"] == "NSX-T")'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["net.peer.name"], "(?P<node_building_block>bb\\d{3})"), "upsert") where log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and (log.attributes["audit_source"] == "ESXi" or log.attributes["audit_source"] == "NSX-T")'

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
        - 'log.attributes["audit_source"] == "ESXi"'
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
        - 'log.attributes["audit_source"] == "ESXi"'
        - 'log.attributes["appname"] == "sshd"'
        - 'IsMatch(log.attributes["message"], ".*Accepted keyboard-interactive/pam for root from.*")'
      statements:
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "%{WORD:sshd_application}\\[%{NUMBER:sshd_process_id}\\]: %{WORD:sshd_status} %{DATA:sshd_auth_method} for %{USERNAME:sshd_user} from %{IP:sshd_ip} port %{NUMBER:sshd_port} %{WORD:sshd_protocol}", true), "upsert")'

{{/*
  ============================================================================
  Adds an attribute to identify audit logs for routing.
  Audit-relevant processes: Hostd, NSX, procstate, shell, sshd, ssoAudit, vpxd, ssoadminserver, sudo
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

failover/opensearch_syslog_audit:
  priority_levels:
    - [logs/failover_a_syslog_audit]
    - [logs/failover_b_syslog_audit]
  retry_interval: 1h
  sending_queue:
    block_on_overflow: true
    enabled: true
    num_consumers: 2
    queue_size: 10000
    sizer: requests

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
opensearch/failover_a_syslog_audit:
  http:
    auth:
      authenticator: basicauth/syslog_audit_failover_a
    endpoint: {{ required "openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint is required when kafka is disabled" .Values.openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint }}
  logs_index: audit-datastream
  retry_on_failure:
    enabled: true
    initial_interval: 1s
    max_interval: 5s
    max_elapsed_time: 30s
  timeout: 30s
opensearch/failover_b_syslog_audit:
  http:
    auth:
      authenticator: basicauth/syslog_audit_failover_b
    endpoint: {{ required "openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint is required when kafka is disabled" .Values.openTelemetry.externalCollector.syslogConfig.openSearchLogs.auditEndpoint }}
  logs_index: audit-datastream
  retry_on_failure:
    enabled: true
    initial_interval: 1s
    max_interval: 5s
    max_elapsed_time: 30s
  timeout: 30s
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
kafka/syslog_audit:
  brokers:
{{- range .Values.openTelemetry.kafka.brokers }}
    - {{ . }}
{{- end }}
  protocol_version: {{ .Values.openTelemetry.kafka.protocol_version }}
  logs:
    topic: {{ required "openTelemetry.externalCollector.syslogConfig.auditKafkaTopic is required when kafka is enabled" .Values.openTelemetry.externalCollector.syslogConfig.auditKafkaTopic }}
    encoding: {{ .Values.openTelemetry.kafka.encoding }}
  producer:
    compression: {{ .Values.openTelemetry.kafka.compression }}
{{- if .Values.openTelemetry.kafka.tls.enabled }}
  tls:
    insecure: false
{{- end }}
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
logs/failover_a_syslog_audit:
  receivers: [failover/opensearch_syslog_audit]
  processors: [attributes/syslog_audit_failover_username_a]
  exporters: [opensearch/failover_a_syslog_audit]

logs/failover_b_syslog_audit:
  receivers: [failover/opensearch_syslog_audit]
  processors: [attributes/syslog_audit_failover_username_b]
  exporters: [opensearch/failover_b_syslog_audit]

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
