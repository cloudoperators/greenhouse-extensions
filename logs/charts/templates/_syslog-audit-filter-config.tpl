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
        - 'set(log.attributes["forwarded_by"], "octobus_logstash") where IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*forwarded_by=octobus_logstash.*")'
        - 'set(log.attributes["forwarded_by"], "octobus_logstash") where log.attributes["message"] == nil and log.body != nil and IsMatch(log.body, ".*forwarded_by=octobus_logstash.*")'
        - 'replace_pattern(log.attributes["message"], " forwarded_by=octobus_logstash", "") where log.attributes["forwarded_by"] == "octobus_logstash" and IsString(log.attributes["message"])'
        - 'replace_pattern(log.body, " forwarded_by=octobus_logstash", "") where log.attributes["forwarded_by"] == "octobus_logstash" and log.body != nil'

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
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "^(?P<appname>[A-Za-z0-9_.-]+):"), "upsert") where log.attributes["appname"] == nil and IsString(log.attributes["message"])'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "^\\S+-pfl\\s+(?P<appname>[A-Za-z0-9_.-]+):"), "upsert") where log.attributes["appname"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], "^\\S+-pfl\\s+")'
        - 'set(log.attributes["appname"], "had") where log.attributes["appname"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], "^had\\[\\d+\\]:")'
        # Recover appname from "name[pid]:" when APP-NAME slot held a severity word (F5 relay)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "^(?P<appname>[A-Za-z0-9_.-]+)\\[\\d+\\]:"), "upsert") where IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], "^[A-Za-z0-9_.-]+\\[\\d+\\]:") and (log.attributes["appname"] == nil or IsMatch(log.attributes["appname"], "^(emergency|alert|critical|error|err|warning|warn|notice|informational|info|debug)$"))'
        # Same, when message starts with a leading severity word: "warning tmm20[...]:"
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "^(?:emergency|alert|critical|error|err|warning|warn|notice|informational|info|debug)\\s+(?P<appname>[A-Za-z0-9_.-]+)\\[\\d+\\]:"), "upsert") where IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], "^(emergency|alert|critical|error|err|warning|warn|notice|informational|info|debug)\\s+[A-Za-z0-9_.-]+\\[\\d+\\]:") and (log.attributes["appname"] == nil or IsMatch(log.attributes["appname"], "^(emergency|alert|critical|error|err|warning|warn|notice|informational|info|debug)$"))'

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
        # Event parsing
        # We won't drop event_type for now, because certain SIEM rules and metrics rely on it.
        - 'set(log.attributes["event.type"], log.attributes["event_type"]) where log.attributes["event.type"] == nil and log.attributes["event_type"] != nil'
        - 'set(log.attributes["event_type"], log.attributes["event.type"]) where log.attributes["event_type"] == nil and log.attributes["event.type"] != nil'

        # Role mapping (Collector = server, sender = client)
        # All statements are defensive: only populate semconv field if not already set.
        - 'set(log.attributes["server.address"], log.attributes["net.host.name"]) where log.attributes["server.address"] == nil and log.attributes["net.host.name"] != nil'
        - 'set(log.attributes["server.port"], log.attributes["net.host.port"]) where log.attributes["server.port"] == nil and log.attributes["net.host.port"] != nil'
        - 'set(log.attributes["client.address"], log.attributes["net.peer.name"]) where log.attributes["client.address"] == nil and log.attributes["net.peer.name"] != nil'
        - 'set(log.attributes["client.port"], log.attributes["net.peer.port"]) where log.attributes["client.port"] == nil and log.attributes["net.peer.port"] != nil'

        # Network vantage-point view
        - 'set(log.attributes["network.local.address"], log.attributes["net.host.ip"]) where log.attributes["network.local.address"] == nil and log.attributes["net.host.ip"] != nil'
        - 'set(log.attributes["network.peer.address"], log.attributes["net.peer.ip"]) where log.attributes["network.peer.address"] == nil and log.attributes["net.peer.ip"] != nil'
        - 'set(log.attributes["network.peer.port"], log.attributes["net.peer.port"]) where log.attributes["network.peer.port"] == nil and log.attributes["net.peer.port"] != nil'
        # network.transport: normalize legacy "IP.TCP"/"IP.UDP" to lowercase semconv enum values.
        # Semconv requires transport whenever a port is set (ports are ambiguous without it).
        - 'set(log.attributes["network.transport"], "tcp") where log.attributes["network.transport"] == nil and log.attributes["net.transport"] == "IP.TCP"'
        - 'set(log.attributes["network.transport"], "udp") where log.attributes["network.transport"] == nil and log.attributes["net.transport"] == "IP.UDP"'
        # Fallback: if some other value shows up, lowercase it defensively.
        - 'set(log.attributes["network.transport"], ConvertCase(log.attributes["net.transport"], "lower")) where log.attributes["network.transport"] == nil and log.attributes["net.transport"] != nil'

        # Syslog fields
        - 'set(log.attributes["syslog.facility.code"], Int(log.attributes["facility"])) where log.attributes["syslog.facility.code"] == nil and log.attributes["facility"] != nil and IsMatch(log.attributes["facility"], "^[0-9]+$")'
        - 'set(log.attributes["syslog.facility.name"], log.attributes["facility_text"]) where log.attributes["syslog.facility.name"] == nil and log.attributes["facility_text"] != nil'

        # Resource: host identity
        # Overwrites previously set syslog_host_name by inner hostname
        - 'set(resource.attributes["host.name"], log.attributes["hostname"]) where log.attributes["hostname"] != nil and resource.attributes["host.name"] == nil'
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
        - 'delete_key(log.attributes, "net.host.name") where log.attributes["server.address"] != nil'
        - 'delete_key(log.attributes, "net.host.port") where log.attributes["server.port"] != nil'
        - 'delete_key(log.attributes, "net.peer.name") where log.attributes["client.address"] != nil'
        - 'delete_key(log.attributes, "net.peer.port") where log.attributes["client.port"] != nil and log.attributes["network.peer.port"] != nil'

        # Network vantage-point
        - 'delete_key(log.attributes, "net.host.ip") where log.attributes["network.local.address"] != nil'
        - 'delete_key(log.attributes, "net.peer.ip") where log.attributes["network.peer.address"] != nil'
        - 'delete_key(log.attributes, "net.transport") where log.attributes["network.transport"] != nil'

        # Syslog fields
        - 'delete_key(log.attributes, "facility") where log.attributes["syslog.facility.code"] != nil'
        - 'delete_key(log.attributes, "facility_text") where log.attributes["syslog.facility.name"] != nil'
        # Drop raw syslog_timestamp only when a valid timestamp was parsed into time_unix_nano.
        # RFC 3164 "Mmm DD HH:MM:SS" has no year and fails OpenSearch date mapping
        # (strict_date_optional_time||epoch_millis). Keeping it when time_unix_nano == 0
        # preserves the only timing info available for that log.
        - 'delete_key(log.attributes, "syslog_timestamp") where log.attributes["syslog_timestamp"] != nil and log.time_unix_nano != 0'

        # Resource-mapped: hostname → resource.host.name
        - 'delete_key(log.attributes, "hostname") where log.attributes["hostname"] != nil and resource.attributes["host.name"] == log.attributes["hostname"]'

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
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "user=(?P<syslog_user>[^\\]]+)\\]"), "upsert") where IsString(log.attributes["message"])'
        # Extract "for user xyz from" pattern (fallback if user not already found)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "for user (?P<syslog_user>.*?) from"), "upsert") where log.attributes["syslog_user"] == nil and IsString(log.attributes["message"])'
    # Failed/Cannot login parsing - only for Hostd, vobd, vpxd processes
    - context: log
      conditions:
        - 'IsMatch(log.attributes["appname"], "(?i)^(Hostd|vobd|vpxd):?$")'
      statements:
        # Match userid in format <userid>@<domain>
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?(?P<syslog_user>[a-zA-Z0-9._-]+)@"), "upsert") where log.attributes["syslog_user"] == nil and IsString(log.attributes["message"])'
        # Match userid in format <domain>\<userid>
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?(?:\\S+)\\\\(?P<syslog_user>\\S+)"), "upsert") where log.attributes["syslog_user"] == nil and IsString(log.attributes["message"])'
        # Match simple userid (fallback)
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "(Failed|Cannot) login (user )?%{USERNAME:syslog_user}", true), "upsert") where log.attributes["syslog_user"] == nil and IsString(log.attributes["message"])'

{{/*
  ============================================================================
  Octobus to Fortlogs Field Normalization
  Implements the full `fortlogs.maps_to` mapping declared in
  attributes.octobus.yaml. Gated to the Octobus HTTP path (log.type=sysloghttp).

  Runs after user extraction and before hostname parsing so the mapped fields
  are available to downstream classification. resource.host.name is bridged
  from log.syslog.hostname.

  Overwrite policy: guarded on the SOURCE (Octobus field present), overwriting
  the target; Logstash-parsed Octobus values are authoritative for these fields.
  SAFETY: ip-typed targets only set on literal IPv4; integers via Int();
  user.name skips empty strings.
  ============================================================================
*/}}
transform/octobus_to_fortlogs_normalization:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'IsMatch(log.attributes["log.type"], "sysloghttp")'
      statements:
        # ===== SYSLOG METADATA =====
        - 'set(resource.attributes["host.name"], log.attributes["log.syslog.hostname"]) where log.attributes["log.syslog.hostname"] != nil'
        - 'set(log.attributes["syslog.facility.name"], log.attributes["syslog_facility"]) where log.attributes["syslog_facility"] != nil'
        - 'set(log.attributes["syslog.facility.code"], Int(log.attributes["syslog_facility_code"])) where log.attributes["syslog_facility_code"] != nil'
        - 'set(log.attributes["syslog.priority"], Int(log.attributes["syslog_pri"])) where log.attributes["syslog_pri"] != nil'
        - 'set(log.attributes["severity.text"], log.attributes["syslog_severity"]) where log.attributes["syslog_severity"] != nil'
        - 'set(log.attributes["severity.number"], Int(log.attributes["syslog_severity_code"])) where log.attributes["syslog_severity_code"] != nil'

        # ===== DEVICE / HOST IDENTIFICATION =====
        - 'set(log.attributes["host.name"], log.attributes["dvchost"]) where log.attributes["dvchost"] != nil'
        - 'set(log.attributes["hw.id"], log.attributes["deviceExternalId"]) where log.attributes["deviceExternalId"] != nil'
        - 'set(log.attributes["hw.vendor"], log.attributes["vendor"]) where log.attributes["vendor"] != nil'
        - 'set(log.attributes["hw.model"], log.attributes["product"]) where log.attributes["product"] != nil'
        - 'set(log.attributes["hw.firmware_version"], log.attributes["deviceVersion"]) where log.attributes["deviceVersion"] != nil'
        - 'set(log.attributes["host.partition"], log.attributes["virtDomain"]) where log.attributes["virtDomain"] != nil'

        # ===== NETWORK FLOW (ip-guarded) =====
        - 'set(log.attributes["source.address"], log.attributes["src"]) where log.attributes["src"] != nil and IsMatch(log.attributes["src"], "^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$")'
        - 'set(log.attributes["destination.address"], log.attributes["dst"]) where log.attributes["dst"] != nil and IsMatch(log.attributes["dst"], "^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$")'
        - 'set(log.attributes["source.port"], Int(log.attributes["spt"])) where log.attributes["spt"] != nil'
        - 'set(log.attributes["destination.port"], Int(log.attributes["dpt"])) where log.attributes["dpt"] != nil'
        - 'set(log.attributes["network.protocol.name"], ConvertCase(log.attributes["proto"], "lower")) where log.attributes["proto"] != nil'

        # ===== TIMESTAMPS (string pass-through; formats vary per vendor) =====
        - 'set(log.attributes["event.received"], log.attributes["rt"]) where log.attributes["rt"] != nil'
        - 'set(log.attributes["event.created"], log.attributes["gt"]) where log.attributes["gt"] != nil'

        # ===== EVENT CLASSIFICATION =====
        - 'set(log.attributes["event.type"], log.attributes["event_type"]) where log.attributes["event_type"] != nil'
        - 'set(log.attributes["event.category"], log.attributes["event_SubType"]) where log.attributes["event_SubType"] != nil'
        - 'set(log.attributes["event.action"], log.attributes["SimplifiedDeviceAction"]) where log.attributes["SimplifiedDeviceAction"] != nil'
        - 'set(log.attributes["event.message"], log.attributes["msg"]) where log.attributes["msg"] != nil'
        - 'set(log.attributes["event.reason"], log.attributes["event_reason"]) where log.attributes["event_reason"] != nil'
        - 'set(log.attributes["event.name"], log.attributes["eventName"]) where log.attributes["eventName"] != nil'
        - 'set(log.attributes["event.status"], log.attributes["status"]) where log.attributes["status"] != nil'
        - 'set(log.attributes["event.category.id"], log.attributes["logCatID"]) where log.attributes["logCatID"] != nil'
        - 'set(log.attributes["event.severity.text"], log.attributes["severityLevel"]) where log.attributes["severityLevel"] != nil'

        # ===== SECURITY / POLICY =====
        - 'set(log.attributes["security_rule.group.id"], log.attributes["policyID"]) where log.attributes["policyID"] != nil'
        - 'set(log.attributes["security.threat.score"], Int(log.attributes["threatScore"])) where log.attributes["threatScore"] != nil'
        - 'set(log.attributes["security.signature.severity.text"], log.attributes["signatureSeverity"]) where log.attributes["signatureSeverity"] != nil'

        # ===== APPLICATION / SERVICE =====
        - 'set(log.attributes["service.name"], log.attributes["app"]) where log.attributes["app"] != nil'
        - 'set(log.attributes["service.namespace"], log.attributes["appCat"]) where log.attributes["appCat"] != nil'

        # ===== SESSION / TRAFFIC METRICS =====
        - 'set(log.attributes["session.id"], log.attributes["sessionID"]) where log.attributes["sessionID"] != nil'
        - 'set(log.attributes["session.duration"], Int(log.attributes["dt"])) where log.attributes["dt"] != nil'
        - 'set(log.attributes["network.bytes.out"], Int(log.attributes["out"])) where log.attributes["out"] != nil'
        - 'set(log.attributes["network.bytes.in"], Int(log.attributes["in"])) where log.attributes["in"] != nil'

        # ===== AUTHENTICATION =====
        - 'set(log.attributes["user.name"], log.attributes["user"]) where log.attributes["user"] != nil and log.attributes["user"] != ""'
        - 'set(log.attributes["authentication.method"], log.attributes["authentType"]) where log.attributes["authentType"] != nil'
        - 'set(log.attributes["authentication.failure_reason"], log.attributes["failureReason"]) where log.attributes["failureReason"] != nil'

        # ===== TUFIN-SPECIFIC =====
        - 'set(log.attributes["monitored.host.name"], log.attributes["monitoredDevice"]) where log.attributes["monitoredDevice"] != nil'
        - 'set(log.attributes["monitored.host.ip"], log.attributes["monitoredIP"]) where log.attributes["monitoredIP"] != nil and IsMatch(log.attributes["monitoredIP"], "^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$")'
        - 'set(log.attributes["monitored.host.id"], log.attributes["monitoredID"]) where log.attributes["monitoredID"] != nil'
        - 'set(log.attributes["cluster.name"], log.attributes["cluster"]) where log.attributes["cluster"] != nil'
        - 'set(log.attributes["threshold.value"], Int(log.attributes["threshold"])) where log.attributes["threshold"] != nil'

{{/*
  ============================================================================
  CEF Parsing
  ============================================================================
*/}}
transform/cef_parsing:
  error_mode: ignore
  log_statements:
    - context: log
      statements:
        # Client
        - 'set(log.attributes["client.address"], ExtractPatterns(log.attributes["message"], "(?:^| )(?:caddr|Remote-Address)=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )(?:caddr|Remote-Address)=")'
        - 'set(log.attributes["client.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )cport=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )cport=")'
        # Destination
        - 'set(log.attributes["destination.address"], ExtractPatterns(log.attributes["message"], "(?:^| )dst=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )dst=")'
        - 'set(log.attributes["destination.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )dpt=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )dpt=")'
        # Event Attributes
        - 'set(log.attributes["event.action"], ConvertCase(ExtractPatterns(log.attributes["message"], "(?:^| )act=(?P<v>[^ ]+)")["v"], "lower")) where IsMatch(log.attributes["message"], "(?:^| )act=")'
        - 'set(log.attributes["event.category"], "network") where IsMatch(log.attributes["message"], "(?:^| )event_type=")'
        - 'set(log.attributes["event.created"], Time(ExtractPatterns(log.attributes["message"], "(?:^| )rt=(?P<v>[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} [A-Za-z]+)")["v"], "%b %d %Y %H:%M:%S %Z")) where IsMatch(log.attributes["message"], "(?:^| )rt=")'
        - 'set(log.attributes["event.type"], ExtractPatterns(log.attributes["message"], "(?:^| )event_type=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )event_type=")'
        - 'set(log.attributes["event.description"], ExtractPatterns(log.attributes["message"], "(?:^| )subject=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )subject=")'
        # Hardware
        - 'set(log.attributes["hw.model"], ExtractPatterns(log.attributes["message"], "(?:^| )product=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )product=")'
        # Host Attributes
        - 'set(log.attributes["host.name"], ExtractPatterns(log.attributes["message"], "(?:^| )dvc=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )dvc=")'
        # Network
        - 'set(log.attributes["network.interface.name"], ExtractPatterns(log.attributes["message"], "(?:^| )ifname=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )ifname=")'
        - 'set(log.attributes["network.io.bytes.total"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )bytes=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )bytes=")'
        - 'set(log.attributes["network.io.bytes.received"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )bytes_in=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )bytes_in=")'
        - 'set(log.attributes["network.io.bytes.transmitted"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )bytes_out=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )bytes_out=")'
        - 'set(log.attributes["network.io.packets.total"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )packets=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )packets=")'
        - 'set(log.attributes["network.io.packets.received"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )packetsReceived=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )packetsReceived=")'
        - 'set(log.attributes["network.io.packets.transmitted"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )packetsSent=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )packetsSent=")'
        - 'set(log.attributes["network.local.address"], ExtractPatterns(log.attributes["message"], "(?:^| )laddr=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )laddr=")'
        - 'set(log.attributes["network.local.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )lport=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )lport=")'
        - 'set(log.attributes["network.peer.address"], ExtractPatterns(log.attributes["message"], "(?:^| )paddr=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )paddr=")'
        - 'set(log.attributes["network.peer.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )pport=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )pport=")'
        - 'set(log.attributes["network.protocol.name"], ConvertCase(ExtractPatterns(log.attributes["message"], "(?:^| )protocol=(?P<v>[^ ]+)")["v"], "lower")) where IsMatch(log.attributes["message"], "(?:^| )protocol=")'
        - 'set(log.attributes["network.protocol.number"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )proto=(?P<v>[^ ]+)")["v"], "lower")) where IsMatch(log.attributes["message"], "(?:^| )proto=")'
        # Security Rule Attributes
        - 'set(log.attributes["security_rule.name"], ExtractPatterns(log.attributes["message"], "(?:^| )rule=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )rule=")'
        - 'set(log.attributes["security_rule.uuid"], ExtractPatterns(log.attributes["message"], "(?:^| )rule_uid=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )rule_uid=")'
        - 'set(log.attributes["security_rule.action"], ExtractPatterns(log.attributes["message"], "(?:^| )rule_action=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )rule_action=")'
        - 'set(log.attributes["security_rule.ruleset.name"], ExtractPatterns(log.attributes["message"], "(?:^| )layer_name=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )layer_name=")'
        # Server
        - 'set(log.attributes["server.address"], ExtractPatterns(log.attributes["message"], "(?:^| )saddr=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )saddr=")'
        - 'set(log.attributes["server.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )sport=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )sport=")'
        # Source
        - 'set(log.attributes["source.address"], ExtractPatterns(log.attributes["message"], "(?:^| )src=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )src=")'
        - 'set(log.attributes["source.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )spt=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )spt=")'
        # No standardized Name yet
        - 'set(log.attributes["cef.relay_name"], ExtractPatterns(log.attributes["message"], "(?:^| )relay_name=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )relay_name=")'
        - 'set(log.attributes["firewall.zone.inbound"], ExtractPatterns(log.attributes["message"], "(?:^| )inzone=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )inzone=")'
        - 'set(log.attributes["firewall.zone.outbound"], ExtractPatterns(log.attributes["message"], "(?:^| )outzone=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )outzone=")'
        - 'set(log.attributes["cef.origin"], ExtractPatterns(log.attributes["message"], "(?:^| )origin=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )origin=")'
        - 'set(log.attributes["cef.originsicname"], ExtractPatterns(log.attributes["message"], "(?:^| )originsicname=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )originsicname=")'
        - 'set(log.attributes["cef.security_layer_uuid"], ExtractPatterns(log.attributes["message"], "(?:^| )layer_uuid=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )Security layer_uuid=")'
        - 'set(log.attributes["cef.cs2"], ExtractPatterns(log.attributes["message"], "(?:^| )cs2=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )cs2=")'

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
        # handle double header / relay host name
        - 'set(log.attributes["syslog.host.name"], log.attributes["syslog_host_name"]) where log.attributes["syslog_host_name"] != nil'
        - 'delete_key(log.attributes, "syslog_host_name") where log.attributes["syslog_host_name"] != nil'
        - 'set(log.attributes["syslog.host.name"], resource.attributes["host.name"]) where log.attributes["syslog.host.name"] == nil and log.attributes["hostname"] != nil and resource.attributes["host.name"] != nil and log.attributes["hostname"] != resource.attributes["host.name"]'
        - 'set(resource.attributes["host.name"], log.attributes["hostname"]) where log.attributes["hostname"] != nil and log.attributes["hostname"] != ""'
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
        # Mark stnpa logs as audit-relevant (stnpa has no netbox slug; identified only by audit source)
        - 'set(log.attributes["audit_relevant"], "true") where log.attributes["sap.cc.audit.source"] == "stnpa"'
        # Mark network logs as audit-relevant
        - 'set(log.attributes["audit_relevant"], "true") where log.attributes["netbox.manufacturer.slug"] != nil and IsMatch(log.attributes["netbox.manufacturer.slug"], "(check-point|trend-micro|tufin|radware|f5)")'
        - 'set(log.attributes["audit_relevant"], "true") where log.attributes["netbox.platform.slug"] != nil and IsMatch(log.attributes["netbox.platform.slug"], "(cisco-ise|cisco-asa)")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "palo-alto-networks"'
      statements:
        - 'set(log.attributes["audit_relevant"], "true") where log.attributes["event_type"] == "THREAT"'
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), ".*THREAT.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "ips-ids") where log.attributes["sap.cc.audit.source"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit|IPSsystem|SMSsystem|SMSaudit|m-ips-sms).*")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "radware" and log.attributes["event_type"] != nil'
      statements:
         - 'set(log.attributes["audit_relevant"], "true") where IsMatch(log.attributes["event_type"], "^(CyberController\\.Forwarded\\.Auditing|DefensePro\\.Auditing|CyberController\\.Forwarded\\.Security|CyberController\\.Auditing|\\(empty\\)|DefensePro\\.Security|DefensePro\\.AttackEvent|FlowDetector\\.Auditing|FlowDetector\\.Configuration|CyberController\\.AttackLifeCycle)$")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "tufin" and log.attributes["event_type"] != nil'
      statements:
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(log.attributes["event_type"], "^(Audit|Log|TOS Notification)$")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "fortinet"'
      statements:
        # Explicit blocks/denials/drops.
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), ".*\\b(action=\"?(deny|drop|block)\"?|act=deny).*")'
        # Threat / security subsystems: IPS, UTM, virus, webfilter, DNS filter,
        # app-control, and client-reputation scoring (crscore/crlevel present).
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), "(?i).*\\b(type=\"?(utm|ips|virus|webfilter|dns|app-ctrl|anomaly|waf|emailfilter))\"?.*")'
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), ".*\\bcrscore=\\d+.*")'
        # Authentication / admin events.
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), "(?i).*user.*") and IsMatch(Concat([log.attributes["message"], log.body], " "), "(?i).*auth.*")'
        # Keep existing IPS catch-all.
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), "(?i).*ips.*")'
        - 'set(log.attributes["audit_relevant"], "true") where log.attributes["event_type"] == "event"'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "genua"'
      statements:
        # pf packet-filter BLOCK events are security-relevant.
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), ".*pf: rule \\d+.*block.*")'
        # ALG relay connections EXCEPT routine successful/reset completions (volume
        # control - genua relay accounting is high-volume; status=OK/EPIPE are benign).
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), ".*rule_name=\\S+.*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*status=(OK|EPIPE).*")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "vmware"'
      statements:
        - 'set(log.attributes["audit_relevant"], "true")'
    - context: log
      conditions:
        - 'log.attributes["audit_relevant"] != "true" and log.attributes["event_type"] != nil'
      statements:
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(log.attributes["event_type"], "^(Authorization|Authentication|IPSaudit|SMSaudit|utm)$")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil'
      statements:
        - 'set(log.attributes["audit_relevant"], "true") where IsMatch(Concat([log.attributes["message"], log.body], " "), ".*attacker.*")'
    - context: log
      conditions:
        - 'log.attributes["audit_relevant"] == "true" and log.attributes["sap.cc.audit.source"] == nil and log.attributes["netbox.platform.slug"] != nil'
      statements:
        - 'set(log.attributes["sap.cc.audit.source"], log.attributes["netbox.platform.slug"])'
    - context: log
      conditions:
        - 'log.attributes["audit_relevant"] == "true" and log.attributes["sap.cc.audit.source"] == nil and log.attributes["netbox.manufacturer.slug"] != nil'
      statements:
        - 'set(log.attributes["sap.cc.audit.source"], log.attributes["netbox.manufacturer.slug"])'

# Uses observedTimestamp as fallback when no timestamp could be parsed from the log body
# (e.g. unknown format logs that end up with @timestamp = 1970-01-01T00:00:00Z)
transform/syslog_observed_timestamp_fallback:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'log.time_unix_nano == 0'
      statements:
        - 'set(log.time_unix_nano, log.observed_time_unix_nano)'
{{- end }}

{{- define "syslog_audit_filter.connectors" }}
{{/*
  ============================================================================
  Routing connector: separates audit from non-audit syslog logs
  Audit logs go to audit-datastream, non-audit logs go to logs-datastream
  ============================================================================
*/}}
{{- if not .Values.openTelemetry.auditKafka.enabled }}
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
  logs_index_on_error: logs-datastream-deadletter
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
  logs_index_on_error: logs-datastream-deadletter
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
{{- if and (not (empty .Values.openTelemetry.kafka.tls.caSecret)) (not (empty .Values.openTelemetry.kafka.tls.caSecretKey)) }}
    ca_file: /etc/ssl/kafka/{{ .Values.openTelemetry.kafka.tls.caSecretKey }}
{{- end }}
{{- end }}
{{- if not (empty .Values.openTelemetry.kafka.users) }}
{{- range $user := .Values.openTelemetry.kafka.users }}
{{- if eq $user.name "write-all" }}
  auth:
    sasl:
      username: {{ $user.name }}
      password: ${{ "{" }}kafka_logs_{{ $user.name | replace "-" "_" }}_password}
      mechanism: SCRAM-SHA-512
{{- end }}
{{- end }}
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
{{- if not .Values.openTelemetry.auditKafka.enabled }}
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
{{- if .Values.openTelemetry.auditKafka.enabled }}
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
