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
        - 'set(log.attributes["syslog.facility.code"], Int(log.attributes["facility"])) where log.attributes["syslog.facility.code"] == nil and log.attributes["facility"] != nil'
        - 'set(log.attributes["syslog.facility.name"], log.attributes["facility_text"]) where log.attributes["syslog.facility.name"] == nil and log.attributes["facility_text"] != nil'

        # Resource: host identity
        # Transforms host.name from fqdn to short-name
        - 'set(resource.attributes["host.name"], log.attributes["hostname"]) where resource.attributes["host.name"] == nil and log.attributes["hostname"] != nil'
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
        - 'delete_key(log.attributes, "hostname") where resource.attributes["host.name"] != nil'

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
  =======================================================================================
  Network device parsing - extract audit source.
  Detects vendor/product based on message content patterns.
  Only sets sap.cc.audit.source if it hasn't been set already.
  OTTL is first-match-wins via the `== nil` guard, so statement ORDER encodes precedence.
  =======================================================================================
*/}}
transform/syslog_network_parsing:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'log.attributes["sap.cc.audit.source"] == nil'
      statements:
        # Check Point (CEF) - message contains "(Check Point)"
        # Highest priority: the generic fw/daemon branch explicitly excludes this.
        - 'set(log.attributes["sap.cc.audit.source"], "checkpoint") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*\\(Check Point\\).*")'
        - 'set(log.attributes["sap.cc.audit.source"], "checkpoint") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*\\(Check Point\\).*")'
        # Cisco ISE - "ise-saas", "ise-idc", or "eu-de-2-gmp-prx-1[abc]"
        # Placed before Cisco Router because ISE hostnames may contain "-rt##"
        # patterns that would otherwise match the router rule.
        - 'set(log.attributes["sap.cc.audit.source"], "cise") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        - 'set(log.attributes["sap.cc.audit.source"], "cise") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        # TrendMicro - "TrendMicro" AND ("IPSevent" or "IPSaudit")
        - 'set(log.attributes["sap.cc.audit.source"], "trendmicro") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*TrendMicro.*") and IsMatch(log.attributes["message"], ".*(IPSevent|IPSaudit).*")'
        - 'set(log.attributes["sap.cc.audit.source"], "trendmicro") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*TrendMicro.*") and IsMatch(log.body, ".*(IPSevent|IPSaudit).*")'
        # Fortinet
        - 'set(log.attributes["sap.cc.audit.source"], "fortinet") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*Fortinet.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "fortinet") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*Fortinet.*")'
        # Radware (DefensePro / CyberController)
        - 'set(log.attributes["sap.cc.audit.source"], "radware") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*Radware.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "radware") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*Radware.*")'
        # Palo Alto Networks - CEF messages containing "Palo Alto Networks"
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*Palo Alto Networks.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*Palo Alto Networks.*")'
        # Palo Alto Networks - "fw-idc-pan" hostname (does NOT contain the
        # literal "Palo Alto Networks"; matches the Logstash negative lookahead).
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*fw-idc-pan.*") and not IsMatch(log.attributes["message"], ".*Palo Alto Networks.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*fw-idc-pan.*") and not IsMatch(log.body, ".*Palo Alto Networks.*")'
        # Palo Alto Networks (netsplunk IPS - m-ips-sms[1|2|5|6|9|10]) AND (IPSevent|IPSaudit)
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*m-ips-sms(1|2|5|6|9|10).*") and IsMatch(log.attributes["message"], ".*(IPSevent|IPSaudit).*")'
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*m-ips-sms(1|2|5|6|9|10).*") and IsMatch(log.body, ".*(IPSevent|IPSaudit).*")'
        # Palo Alto Networks (netsplunk system/audit events)
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*(IPSsystem|SMSsystem|SMSaudit).*")'
        - 'set(log.attributes["sap.cc.audit.source"], "paloalto") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*(IPSsystem|SMSsystem|SMSaudit).*")'
        # Cisco ASA firewall - message contains "%ASA-" (leading space preserved
        # to match Logstash "(?: %ASA-)").
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-asa") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".* %ASA-.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-asa") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".* %ASA-.*")'
        # Check Point firewall gateway syslog (daemon logs) -
        # hostname matches fw|FW- AND a known daemon AND NOT "(Check Point)".
        # Replicates Logstash: (fw|FW-) and (daemons...) and !(Check Point)
        - 'set(log.attributes["sap.cc.audit.source"], "checkpoint") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*(fw|FW-).*") and IsMatch(log.attributes["message"], ".*(last message|clish\\[|xpand\\[|sshd\\[|agetty\\[|auditd\\[|crond\\[|routed\\[|pm\\[|snmpd:|sudo:|kernel:|frontstage:|logger:|spike_detective:|cpviewd:).*") and not IsMatch(log.attributes["message"], ".*\\(Check Point\\).*")'
        - 'set(log.attributes["sap.cc.audit.source"], "checkpoint") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*(fw|FW-).*") and IsMatch(log.body, ".*(last message|clish\\[|xpand\\[|sshd\\[|agetty\\[|auditd\\[|crond\\[|routed\\[|pm\\[|snmpd:|sudo:|kernel:|frontstage:|logger:|spike_detective:|cpviewd:).*") and not IsMatch(log.body, ".*\\(Check Point\\).*")'
        # Cisco Nexus (MAC move / flap events)
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-nexus") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-nexus") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        # Cisco Router - hostname pattern "rt-*" or "*-rt##*"
        # (excludes CISE_Failed_Attempts, matching the Logstash guard).
        # Placed AFTER ISE/PAN/Nexus so those more-specific vendors win.
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-router") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(log.attributes["message"], ".*CISE_Failed_Attempts.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-router") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(log.body, ".*CISE_Failed_Attempts.*")'
        # Cisco Router - "rtb" hostname pattern e.g. "<123>rtb...:"
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-router") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], "<\\d+>rtb\\S+:")'
        - 'set(log.attributes["sap.cc.audit.source"], "cisco-router") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, "<\\d+>rtb\\S+:")'
        # Tufin SecureTrack / TOS Monitoring
        - 'set(log.attributes["sap.cc.audit.source"], "tufin") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and (IsMatch(log.attributes["message"], ".* SecureTrack: .*") or IsMatch(log.attributes["message"], ".*Tufin SecureTrack, .*") or IsMatch(log.attributes["message"], ".*TOS Monitoring Notification.*"))'
        - 'set(log.attributes["sap.cc.audit.source"], "tufin") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and (IsMatch(log.body, ".* SecureTrack: .*") or IsMatch(log.body, ".*Tufin SecureTrack, .*") or IsMatch(log.body, ".*TOS Monitoring Notification.*"))'
        # F5 ASM WAF - message contains "ASM:unit_hostname"
        - 'set(log.attributes["sap.cc.audit.source"], "waf") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*ASM:unit_hostname.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "waf") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*ASM:unit_hostname.*")'
        # Load Balancer - message contains "attacker".
        # LAST because "attacker" is broad; only unclassified events reach here.
        - 'set(log.attributes["sap.cc.audit.source"], "loadbalancer") where log.attributes["sap.cc.audit.source"] == nil and IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*attacker.*")'
        - 'set(log.attributes["sap.cc.audit.source"], "loadbalancer") where log.attributes["sap.cc.audit.source"] == nil and log.body != nil and IsMatch(log.body, ".*attacker.*")'
    - context: log
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["sap.cc.audit.source"] != nil and IsMatch(log.attributes["sap.cc.audit.source"], "^(checkpoint|cise|cisco-asa|cisco-nexus|cisco-router|trendmicro|fortinet|radware|paloalto|tufin|waf|loadbalancer)$")'
        - 'set(log.attributes["hw.vendor"], "Check Point") where log.attributes["sap.cc.audit.source"] == "checkpoint"'
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["sap.cc.audit.source"] == "cise"'
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["sap.cc.audit.source"] == "cisco-asa"'
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["sap.cc.audit.source"] == "cisco-nexus"'
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["sap.cc.audit.source"] == "cisco-router"'
        - 'set(log.attributes["hw.vendor"], "Trend Micro") where log.attributes["sap.cc.audit.source"] == "trendmicro"'
        - 'set(log.attributes["hw.vendor"], "Fortinet") where log.attributes["sap.cc.audit.source"] == "fortinet"'
        - 'set(log.attributes["hw.vendor"], "Radware") where log.attributes["sap.cc.audit.source"] == "radware"'
        - 'set(log.attributes["hw.vendor"], "Palo Alto Networks") where log.attributes["sap.cc.audit.source"] == "paloalto"'
        - 'set(log.attributes["hw.vendor"], "Tufin") where log.attributes["sap.cc.audit.source"] == "tufin"'
        - 'set(log.attributes["hw.vendor"], "F5") where log.attributes["sap.cc.audit.source"] == "waf"'

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
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(?P<fqdn>node\\d{3}-bb\\d{3}\\.\\S+?)(?:[\\s\\)\"]|$)"), "upsert") where log.attributes["fqdn"] == nil and IsString(log.attributes["message"])'
        # Extract username: prefer Username= value inside LdapUserDetailsImpl wrapper
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Username=(?P<syslog_user>[^@]+)@"), "upsert") where log.attributes["syslog_user"] == nil and IsString(log.attributes["message"])'
        # Extract audit operation fields in a single pass
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "ModuleName=\"(?P<nsx_module>[^\"]+)\", Operation=\"(?P<nsx_operation>[^\"]+)\", Operation status=\"(?P<nsx_operation_status>[^\"]+)\""), "upsert") where log.attributes["nsx_module"] == nil and IsString(log.attributes["message"])'

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
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "Event %{NONNEGINT:event_id} : (?:Reconfigured|Error message on) %{DATA:cloud_instance_name} \\(%{UUID:cloud_instance_id}\\)%{GREEDYDATA}", true), "upsert") where IsString(log.attributes["message"])'

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
        - 'IsString(log.attributes["message"]) and IsMatch(log.attributes["message"], ".*Accepted keyboard-interactive/pam for root from.*")'
      statements:
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "%{WORD:sshd_application}\\[%{NUMBER:sshd_process_id}\\]: %{WORD:sshd_status} %{DATA:sshd_auth_method} for %{USERNAME:sshd_user} from %{IP:sshd_ip} port %{NUMBER:sshd_port} %{WORD:sshd_protocol}", true), "upsert") where IsString(log.attributes["message"])'

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
        - 'set(log.attributes["audit_relevant"], "true") where log.body != nil and IsMatch(log.body, "(?i)(ise-idc|Check Point|Fortinet|Palo Alto Networks|TrendMicro|Tufin)")'
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
