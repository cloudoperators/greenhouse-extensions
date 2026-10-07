{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "syslog_device_classification.transform" }}
{{/*
  =======================================================================================
  Hardware classification.
  Classifies hardware from syslog message/body content in two stages:
    1. Manufacturer extraction
      -> netbox.manufacturer.slug ("cisco", "genua", "fortinet", ...)
    Background: netbox.platform is shared between VMs (virtualization) and physical devices (dcim).
    2. Per-Manufacturer refinement
      -> netbox.platform.slug ("cisco-aci", "fortios", "genugate-os", ...)
      -> netbox.role.slug     ("switch", "router", "firewall", ...)

  Applicable to any hardware category (network, compute, storage, etc.) - the current
  rule set covers network devices, but additional vendors/roles can be added over time.

  Only sets each attribute if not already set (gated by conditions + `== nil` guards).
  OTTL is first-match-wins, so statement ORDER encodes precedence.

  NOTE: Currently the vendor extraction is based on the body, because not all
  hostnames are reliably ingested into resource.host.name. If this issue is solved,
  we can switch some of the extraction rules to resource.host.name.
  =======================================================================================
*/}}
transform/syslog_device_classification:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil and (log.attributes["syslog.format"] == "fortios_kv" or log.attributes["syslog.format"] == "fortios_kv_failed")'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "fortinet")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil and (log.attributes["syslog.format"] == "cisco_ios" or log.attributes["syslog.format"] == "cisco_ios_failed")'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ASM:unit_hostname|securityd|dcos_sshd|clish\\[|tmm\\[|mcpd\\[).*")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil and (log.attributes["syslog.format"] == "cisco_nxos_year" or log.attributes["syslog.format"] == "cisco_nxos_year_failed")'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco")'
        - 'set(log.attributes["netbox.platform.slug"], "cisco-nx-os")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil and log.attributes["node_nodename"] != nil'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "vmware")'
        - 'set(log.attributes["netbox.platform.slug"], "vmware-esxi") where log.attributes["netbox.platform.slug"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil and ((log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], "nsx-ctl.*")) or (log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and IsMatch(log.attributes["net.peer.name"], "nsx-ctl.*")))'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "vmware")'
        - 'set(log.attributes["netbox.platform.slug"], "vmware-nsx-t") where log.attributes["netbox.platform.slug"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil and ((log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], "vc-.*")) or (log.attributes["hostname"] == nil and log.attributes["net.peer.name"] != nil and IsMatch(log.attributes["net.peer.name"], "vc-.*")))'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "vmware")'
        - 'set(log.attributes["netbox.platform.slug"], "vmware-vcsa") where log.attributes["netbox.platform.slug"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.platform.slug"] == "vmware-nsx-t"'
      statements:
        # Extract NSX-T transport-node FQDN (shape: node###-bb###.<domain>)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(?P<fqdn>node\\d{3}-bb\\d{3}\\.\\S+?)(?:[\\s\\)\"]|$)"), "upsert") where log.attributes["fqdn"] == nil and IsString(log.attributes["message"])'
        # Extract username: prefer Username= value inside LdapUserDetailsImpl wrapper
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Username=(?P<syslog_user>[^@]+)@"), "upsert") where log.attributes["syslog_user"] == nil and IsString(log.attributes["message"])'
        # Extract audit operation fields
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "ModuleName=\"(?P<nsx_module>[^\"]+)\", Operation=\"(?P<nsx_operation>[^\"]+)\", Operation status=\"(?P<nsx_operation_status>[^\"]+)\""), "upsert") where log.attributes["nsx_module"] == nil and IsString(log.attributes["message"])'
    - context: log
      conditions:
        - 'log.attributes["netbox.platform.slug"] == "vmware-esxi"'
      statements:
        # Parse VM reconfigure/error events
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "Event %{NONNEGINT:event_id} : (?:Reconfigured|Error message on) %{DATA:cloud_instance_name} \\(%{UUID:cloud_instance_id}\\)%{GREEDYDATA}", true), "upsert") where IsString(log.attributes["message"])'
    - context: log
      conditions:
        - 'log.attributes["netbox.platform.slug"] == "vmware-esxi" and log.attributes["appname"] == "sshd" and IsString(log.attributes["message"])'
      statements:
        # Parse ESXi SSH auth events and align extracted fields to OTel semantic conventions
        - 'merge_maps(log.attributes, ExtractGrokPatterns(log.attributes["message"], "%{WORD:sshd_application}\\[%{NUMBER:sshd_process_id}\\]: %{WORD:sshd_status} %{DATA:sshd_auth_method} for %{USERNAME:sshd_user} from %{IP:sshd_ip} port %{NUMBER:sshd_port} %{WORD:sshd_protocol}", true), "upsert") where IsString(log.attributes["message"])'
        - 'set(log.attributes["user.name"], log.attributes["sshd_user"]) where log.attributes["sshd_user"] != nil'
        - 'set(log.attributes["process.pid"], Int(log.attributes["sshd_process_id"])) where log.attributes["sshd_process_id"] != nil'
        - 'set(log.attributes["client.address"], log.attributes["sshd_ip"]) where log.attributes["sshd_ip"] != nil'
        - 'set(log.attributes["client.port"], Int(log.attributes["sshd_port"])) where log.attributes["sshd_port"] != nil'
        - 'set(log.attributes["event.outcome"], "success") where log.attributes["sshd_status"] == "Accepted"'
        - 'set(log.attributes["event.outcome"], "failure") where log.attributes["sshd_status"] != nil and log.attributes["sshd_status"] != "Accepted"'
        - 'set(log.attributes["network.protocol.name"], "ssh") where log.attributes["sshd_protocol"] != nil'
        - 'set(log.attributes["network.protocol.version"], ExtractPatterns(log.attributes["sshd_protocol"], "ssh(?P<v>\\d+)")["v"]) where log.attributes["sshd_protocol"] != nil'
        - 'set(log.attributes["event_type"], "Authentication") where log.attributes["event_type"] == nil and log.attributes["sshd_status"] != nil'
        - 'delete_key(log.attributes, "sshd_application")'
        - 'delete_key(log.attributes, "sshd_user")'
        - 'delete_key(log.attributes, "sshd_process_id")'
        - 'delete_key(log.attributes, "sshd_ip")'
        - 'delete_key(log.attributes, "sshd_port")'
        - 'delete_key(log.attributes, "sshd_status")'
        - 'delete_key(log.attributes, "sshd_protocol")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil'
      statements:
        # Check Point (CEF) - contains "CEF:[0-9]+|Check Point|". Highest priority.
        - 'set(log.attributes["netbox.manufacturer.slug"], "check-point") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CEF:[0-9]+\\|Check Point\\|.*")'
        # Cisco ISE - before Cisco Router (ISE hostnames may contain "-rt##").
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        # Trend Micro - "TrendMicro"
        - 'set(log.attributes["netbox.manufacturer.slug"], "trend-micro") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CEF:[0-9]+\\|TrendMicro\\|.*")'
        # Fortinet
        - 'set(log.attributes["netbox.manufacturer.slug"], "fortinet") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Fortinet.*")'
        # Radware (DefensePro / CyberController)
        - 'set(log.attributes["netbox.manufacturer.slug"], "radware") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Radware.*")'
        # Palo Alto Networks - CEF "Palo Alto Networks".
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Palo Alto Networks.*")'
        # Palo Alto Networks - "fw-idc-pan" hostname without literal "palo-alto-networks".
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*fw-idc-pan.*")'
        # Palo Alto Networks - netsplunk IPS (m-ips-sms[1|2|5|6|9|10]) AND (IPSevent|IPSaudit).
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*m-ips-sms(1|2|5|6|9|10).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit).*")'
        # Palo Alto Networks - netsplunk system/audit events.
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSsystem|SMSsystem|SMSaudit).*")'
        # Cisco ASA firewall - "%ASA-" (leading space preserved).
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        # Check Point gateway daemon logs - (fw|FW-) AND daemon AND NOT "(Check Point)".
        - 'set(log.attributes["netbox.manufacturer.slug"], "check-point") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(fw|FW-).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(last message|clish\\[|xpand\\[|sshd\\[|agetty\\[|auditd\\[|crond\\[|routed\\[|pm\\[|snmpd:|sudo:|kernel:|frontstage:|logger:|spike_detective:|cpviewd:).*")'
        # Tufin SecureTrack / TOS Monitoring.
        # Tufin is no official manufacturer in Netbox, but we will handle it like that for now
        - 'set(log.attributes["netbox.manufacturer.slug"], "tufin") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*( SecureTrack: |Tufin SecureTrack, |TOS Monitoring Notification|Tufin).*")'
        # F5 ASM WAF - "ASM:unit_hostname".
        - 'set(log.attributes["netbox.manufacturer.slug"], "f5") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*ASM:unit_hostname.*")'
        # Genua genugate/genuscreen firewall - "pf:" or "pf: rule"
        - 'set(log.attributes["netbox.manufacturer.slug"], "genua") where log.attributes["netbox.manufacturer.slug"] == nil and ((log.attributes["appname"] != nil and IsMatch(log.attributes["appname"], "^(pf|had|\\S*relay)$")) or IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(relay_name=\\S+ rnum=|rule_name=\\S+[_-]ALG|pf: rule \\d+.*(block|pass) (in|out) on \\S+).*") )'
        - 'set(log.attributes["netbox.manufacturer.slug"], "f5") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(\\[ssl_acc\\]|\\[ssl_req\\]|/mgmt/tm/(ltm|sys|net|cm|auth)/|/mgmt/shared/|\\bASM:|\\bAPM:|(tmm\\d*|mcpd|bigd|chmand|sod|alertd|mprov|apmd|pam-authenticator)\\[).*")'
        # NetApp
        - 'set(log.attributes["netbox.manufacturer.slug"], "netapp") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(\\[kern_audit:|netapp\\.com/filer/admin).*")'
        # Cisco Nexus (MAC move / flap events).
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        # Cisco Router - "rt-*" or "*-rt##*". After ISE/PAN/Nexus.
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], "(rt-[a-zA-Z0-9.\\-]+|\\S*-rt[0-9]{2,}\\S*)")'
        # Cisco Router - "rtb" hostname e.g. "<123>rtb...:".
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "cisco"'
      statements:
        - 'set(log.attributes["_cisco"], ExtractPatterns(log.attributes["message"], "%(?P<facility>[A-Za-z0-9_]+)-(?P<severity>[0-7])-(?P<event_type>[A-Za-z0-9_]+):\\s*(?P<msg>.*)$")) where log.attributes["message"] != nil and IsMatch(log.attributes["message"], "%[A-Za-z0-9_]+-[0-7]-[A-Za-z0-9_]+:")'
        - 'set(log.attributes["event_type"], log.attributes["_cisco"]["event_type"]) where log.attributes["_cisco"] != nil and log.attributes["_cisco"]["event_type"] != nil and log.attributes["event_type"] == nil'
        - 'delete_key(log.attributes, "_cisco")'
        - 'set(log.attributes["netbox.platform.slug"], "cisco-nx-os") where log.attributes["netbox.platform.slug"] == nil and (log.attributes["syslog.format"] == "cisco_nxos_year" or log.attributes["syslog.format"] == "cisco_nxos_year_failed")'
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        # Finer device product and role (custom, log-derived).
        - 'set(log.attributes["netbox.platform.slug"], "cisco-ise") where log.attributes["netbox.platform.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        - 'set(log.attributes["netbox.role.slug"], "authentication-server") where log.attributes["netbox.role.slug"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise"'
        - 'set(log.attributes["netbox.platform.slug"], "cisco-asa") where log.attributes["netbox.platform.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil and log.attributes["netbox.platform.slug"] == "cisco-asa"'
        - 'set(log.attributes["netbox.role.slug"], "switch") where log.attributes["netbox.role.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        # Extract MAC (Cisco dotted, e.g. 0201.00d5.cbff) into `macaddress` (Elastic-compatible name).
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "(?:Host|Mac)\\s+(?P<macaddress>[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4})"), "upsert") where log.attributes["macaddress"] == nil and IsString(log.attributes["message"])'
        - 'merge_maps(log.attributes, ExtractPatterns(log.body, "(?:Host|Mac)\\s+(?P<macaddress>[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4}\\.[0-9a-fA-F]{4})"), "upsert") where log.attributes["macaddress"] == nil and log.body != nil'
        - 'set(log.attributes["netbox.role.slug"], "router") where log.attributes["netbox.role.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CISE_Failed_Attempts.*")'
        - 'set(log.attributes["netbox.role.slug"], "router") where log.attributes["netbox.role.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
        # Cisco ISE field extraction (only for ISE-classified logs).
        - 'set(log.attributes["event.category"], ExtractPatterns(log.attributes["message"], "(?:^|\\s)(?P<v>CISE_\\S+)")["v"]) where log.attributes["event.category"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "CISE_")'
        - 'set(log.attributes["event.action"], ExtractPatterns(log.attributes["message"], "Action=(?P<v>[^,]+?\\S)(?:,|$)")["v"]) where log.attributes["event.action"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "Action=")'
        - 'set(log.attributes["event.description"], ExtractPatterns(log.attributes["message"], "\\d+ NOTICE (?P<v>[^,]+)")["v"]) where log.attributes["event.description"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "NOTICE ")'
        - 'set(log.attributes["event_type"], ExtractPatterns(log.attributes["message"], "(?:^|[,\\s])Type=(?P<v>[^,]+)")["v"]) where log.attributes["event_type"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(^|[,\\s])Type=[^,]+")'
        - 'set(log.attributes["source.domain"], ExtractPatterns(log.attributes["message"], "NetworkDeviceName=(?P<v>[^,\\s#]+)")["v"]) where log.attributes["source.domain"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "NetworkDeviceName=")'
        - 'set(log.attributes["user.name"], ExtractPatterns(log.attributes["message"], "UserName=(?P<v>[^,]+)")["v"]) where log.attributes["user.name"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "UserName=")'
        - 'set(log.attributes["client.address"], ExtractPatterns(log.attributes["message"], "Remote-Address=(?P<v>[^,]+)")["v"]) where log.attributes["client.address"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "Remote-Address=") and ExtractPatterns(log.attributes["message"], "Remote-Address=(?P<v>[^,]+)")["v"] != nil'
        - 'set(log.attributes["user.terminal"], ExtractPatterns(log.attributes["message"], "(?:^|[,\\s])Port=(?P<v>[^,]+)")["v"]) where log.attributes["user.terminal"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "Port=") and ExtractPatterns(log.attributes["message"], "(?:^|[,\\s])Port=(?P<v>[^,]+)")["v"] != nil'
        - 'set(log.attributes["process.command_args"], ExtractPatterns(log.attributes["message"], "CmdSet=\\[(?P<v>[^\\]]+)\\]")["v"]) where log.attributes["process.command_args"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "CmdSet=")'
        - 'set(log.attributes["error.message"], ExtractPatterns(log.attributes["message"], "FailureReason=(?P<v>[^,]+)")["v"]) where log.attributes["error.message"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "FailureReason=")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "check-point"'
      statements:
        - 'set(log.attributes["netbox.platform.slug"], "check-point-gaia") where log.attributes["netbox.platform.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil'
        # Check Point CEF Log Parsing - OTEL Semantic Conventions Compliant
        # Extract the entire KV section (everything after the CEF header pipes).
        # Skip ParseKeyValue if _kvraw contains malformed tokens (no "=" sign).
        - 'set(log.attributes["_kvraw"], ExtractPatterns(log.attributes["message"], "(?P<_kv>act=.*$)")["_kv"]) where log.attributes["message"] != nil and IsMatch(log.attributes["message"], "act=")'
        - 'set(log.attributes["_kv"], ParseKeyValue(log.attributes["_kvraw"], " ", "=")) where log.attributes["_kvraw"] != nil and IsMatch(log.attributes["_kvraw"], "^([^\\s=]+=[^\\s]*\\s*)+$")'
        # Client address and port (source of connection - client side)
        - 'set(log.attributes["client.address"], log.attributes["_kv"]["src"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["src"] != nil'
        - 'set(log.attributes["client.port"], Int(log.attributes["_kv"]["spt"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["spt"] != nil'
        # Server address and port (destination of connection - server side)
        - 'set(log.attributes["server.address"], log.attributes["_kv"]["dst"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["dst"] != nil'
        - 'set(log.attributes["server.port"], Int(log.attributes["_kv"]["dpt"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["dpt"] != nil'
        # Network protocol and interface
        - 'set(log.attributes["network.protocol.name"], "tcp") where log.attributes["_kv"] != nil and log.attributes["_kv"]["proto"] == "6"'
        - 'set(log.attributes["network.protocol.number"], Int(log.attributes["_kv"]["proto"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["proto"] != nil'
        - 'set(log.attributes["network.interface.name"], log.attributes["_kv"]["ifname"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["ifname"] != nil'
        # Legacy field event_type with value "Log"
        - 'set(log.attributes["event_type"], "Log") where log.attributes["_kv"] != nil'
        # security_rule
        - 'set(log.attributes["security_rule.name"], log.attributes["_kv"]["cs2"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["cs2"] != nil'
        - 'set(log.attributes["security_rule.uuid"], log.attributes["_kv"]["rule_uid"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["rule_uid"] != nil'
        - 'set(log.attributes["security_rule.category"], log.attributes["_kv"]["rule_action"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["rule_action"] != nil'
        - 'set(log.attributes["security_rule.ruleset.name"], log.attributes["_kv"]["layer_name"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["layer_name"] != nil'
        # Organization/source device information
        - 'set(log.attributes["host.name"], log.attributes["_kv"]["originsicname"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["originsicname"] != nil'
        - 'set(log.attributes["host.ip"], log.attributes["_kv"]["origin"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["origin"] != nil'
        # Security-related attributes (custom namespace for firewall-specific data)
        - 'set(log.attributes["firewall.policy_uuid"], log.attributes["_kv"]["Security layer_uuid"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["Security layer_uuid"] != nil'
        - 'set(log.attributes["firewall.zone.inbound"], log.attributes["_kv"]["inzone"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["inzone"] != nil'
        - 'set(log.attributes["firewall.zone.outbound"], log.attributes["_kv"]["outzone"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["outzone"] != nil'
        # Cleanup: Drop the temp maps so no unscoped raw KV leaks downstream
        - 'delete_key(log.attributes, "_kv")'
        - 'delete_key(log.attributes, "_kvraw")'
    # Trend Micro is no official Manufacturer, Platfrom or anything similar in Netbox. We will still handle it as such for transformation purposes.
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "trend-micro"'
      statements:
        - 'set(log.attributes["netbox.role.slug"], "ips-ids") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "fortinet"'
      statements:
        # netbox.platform.slug could be "fortimanager" or "fortios"
        # netbox.role.slug could be "firewall" or "firewall-management"; because logstash always sets "firewall", we will do the same here for now
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "genua"'
      statements:
        # Genua role by hostname (mirrors NetBox): -vv### = vpn-router,
        # -adm = firewall-adm, otherwise firewall. Fallback preserves the
        # previous unconditional "firewall" (no regression).
        - 'set(log.attributes["netbox.role.slug"], "vpn-router") where log.attributes["netbox.role.slug"] == nil and ((log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], ".*-vv\\d+(\\.|$)")) or (resource.attributes["host.name"] != nil and IsMatch(resource.attributes["host.name"], ".*-vv\\d+(\\.|$)")))'
        - 'set(log.attributes["netbox.role.slug"], "firewall-adm") where log.attributes["netbox.role.slug"] == nil and ((log.attributes["hostname"] != nil and IsMatch(log.attributes["hostname"], ".*-adm(\\.|$)")) or (resource.attributes["host.name"] != nil and IsMatch(resource.attributes["host.name"], ".*-adm(\\.|$)")))'
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["hw.vendor"], "Genua") where log.attributes["hw.vendor"] == nil'
        # Platform: only genugate is provable from logs (ALG relays are genugate-
        # exclusive). Set genugate-os when the ALG relay layer is present (relay
        # accounting or *relay appname). pf-only logs are genugate-OR-genuscreen
        # ambiguous -> leave platform UNSET (NetBox resolves authoritatively by
        # hostname). Do NOT guess.
        - 'set(log.attributes["netbox.platform.slug"], "genugate-os") where log.attributes["netbox.platform.slug"] == nil and ((log.attributes["appname"] != nil and IsMatch(log.attributes["appname"], "^\\S*relay$")) or IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(relay_name=\\S+ rnum=|rule_name=\\S+[_-]ALG).*") )'
        # Key value parsing (skip if _kvraw contains malformed tokens)
        - 'set(log.attributes["_kvraw"], ExtractPatterns(log.attributes["message"], "(?P<kv>(?:baddr=|caddr=|relay_name=|rule_name=|saddr=).*)$")["kv"]) where log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(relay_name=|rule_name=|baddr=|caddr=|saddr=)")'
        - 'set(log.attributes["_kv"], ParseKeyValue(log.attributes["_kvraw"], " ", "=")) where log.attributes["_kvraw"] != nil and IsMatch(log.attributes["_kvraw"], "^([^\\s=]+=[^\\s]*\\s*)+$")'
        # Client leg (client.* = logical client side of the proxied connection).
        - 'set(log.attributes["client.address"], log.attributes["_kv"]["caddr"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["caddr"] != nil'
        - 'set(log.attributes["client.port"], Int(log.attributes["_kv"]["cport"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["cport"] != nil'
        # Server leg (server.* = logical upstream server).
        - 'set(log.attributes["server.address"], log.attributes["_kv"]["saddr"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["saddr"] != nil'
        - 'set(log.attributes["server.port"], Int(log.attributes["_kv"]["sport"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["sport"] != nil'
        # Peer leg (network.peer.* = transport-layer peer of the relay's upstream socket; equals server in simple relays, may differ under NAT/chaining).
        - 'set(log.attributes["network.peer.address"], log.attributes["_kv"]["paddr"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["paddr"] != nil'
        - 'set(log.attributes["network.peer.port"], Int(log.attributes["_kv"]["pport"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["pport"] != nil'
        # Local leg (network.local.* = the relay's own local socket).
        - 'set(log.attributes["network.local.address"], log.attributes["_kv"]["laddr"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["laddr"] != nil'
        - 'set(log.attributes["network.local.port"], Int(log.attributes["_kv"]["lport"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["lport"] != nil'
        # Transport protocol (IP proto number -> semconv network.transport).
        - 'set(log.attributes["network.transport"], "udp") where log.attributes["_kv"] != nil and log.attributes["_kv"]["proto"] == "17"'
        - 'set(log.attributes["network.transport"], "tcp") where log.attributes["_kv"] != nil and log.attributes["_kv"]["proto"] == "6"'
        # Vendor-agnostic event fields.
        - 'set(log.attributes["event_type"], log.attributes["_kv"]["relay_name"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["relay_name"] != nil and log.attributes["event_type"] == nil'
        - 'set(log.attributes["sap.cc.device.product"], log.attributes["_kv"]["product"]) where log.attributes["_kv"] != nil and log.attributes["_kv"]["product"] != nil'
        # Drop the temp map so no unscoped raw KV leaks downstream.
        - 'delete_key(log.attributes, "_kv")'
        - 'delete_key(log.attributes, "_kvraw")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "radware"'
      statements:
        # Radware = DefensePro + CyberController (two schemas), tenant c0002, json_batch path.
        # Logstash pre-parses CEF; we only map to OTel semconv here.
        # Sentinels to skip: "", "N/A", "0.0.0.0", "255.255.255.255", port "65535".

        # --- Classification (existing) ---
        - 'set(log.attributes["netbox.platform.slug"], "radwareos") where log.attributes["netbox.platform.slug"] == nil'
        - 'set(log.attributes["netbox.role.slug"], "ddos-security-appliance") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'

        # --- user.name (empty for system events) ---
        - 'set(log.attributes["user.name"], log.attributes["user"]) where log.attributes["user"] != nil and log.attributes["user"] != "" and log.attributes["user.name"] == nil and (log.attributes["log.type"] == nil or log.attributes["log.type"] != "sysloghttp")'

        # --- event.action (= audit category) ---
        - 'set(log.attributes["event.action"], log.attributes["auditLogCategory"]) where log.attributes["auditLogCategory"] != nil and log.attributes["auditLogCategory"] != "" and log.attributes["event.action"] == nil'

        # --- event.outcome ---
        # CyberController: via auditStatus. DefensePro: no auditStatus -> use success categories.
        - 'set(log.attributes["event.outcome"], "failure") where log.attributes["auditStatus"] == "Failure" and log.attributes["event.outcome"] == nil'
        - 'set(log.attributes["event.outcome"], "success") where (log.attributes["auditStatus"] == "Completed" or log.attributes["auditStatus"] == "Ended") and log.attributes["event.outcome"] == nil'
        - 'set(log.attributes["event.outcome"], "success") where (log.attributes["auditLogCategory"] == "LoginSuccess" or log.attributes["auditLogCategory"] == "AuthSuccess") and log.attributes["event.outcome"] == nil'
        # "Started"/in-progress states: leave event.outcome unset.

        # --- Network core (sentinel-guarded) ---
        - 'set(log.attributes["client.address"], log.attributes["src"]) where log.attributes["src"] != nil and log.attributes["src"] != "" and log.attributes["src"] != "N/A" and log.attributes["src"] != "0.0.0.0" and log.attributes["src"] != "255.255.255.255" and log.attributes["client.address"] == nil'
        - 'set(log.attributes["client.port"], Int(log.attributes["spt"])) where log.attributes["spt"] != nil and log.attributes["spt"] != "" and log.attributes["spt"] != "N/A" and log.attributes["spt"] != "65535" and log.attributes["client.port"] == nil'
        - 'set(log.attributes["server.address"], log.attributes["dst"]) where log.attributes["dst"] != nil and log.attributes["dst"] != "" and log.attributes["dst"] != "N/A" and log.attributes["dst"] != "0.0.0.0" and log.attributes["dst"] != "255.255.255.255" and log.attributes["server.address"] == nil'
        - 'set(log.attributes["server.port"], Int(log.attributes["dpt"])) where log.attributes["dpt"] != nil and log.attributes["dpt"] != "" and log.attributes["dpt"] != "N/A" and log.attributes["dpt"] != "65535" and log.attributes["server.port"] == nil'

        # --- network.protocol.name (lowercased; skip N/A) ---
        - 'set(log.attributes["network.protocol.name"], ConvertCase(log.attributes["proto"], "lower")) where log.attributes["proto"] != nil and log.attributes["proto"] != "" and log.attributes["proto"] != "N/A" and log.attributes["network.protocol.name"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "palo-alto-networks"'
      statements:
        - 'set(log.attributes["netbox.platform.slug"], "pan-os") where log.attributes["netbox.platform.slug"] == nil'
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        # Network - Client (Source)
        - 'set(log.attributes["client.address"], ExtractPatterns(log.attributes["message"], "(?:^| )src=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )src=")'
        - 'set(log.attributes["client.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )spt=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )spt=")'
        # Network - Server (Destination)
        - 'set(log.attributes["server.address"], ExtractPatterns(log.attributes["message"], "(?:^| )dst=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )dst=")'
        - 'set(log.attributes["server.port"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )dpt=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )dpt=")'
        # Network - Protocol
        - 'set(log.attributes["network.protocol.name"], ConvertCase(ExtractPatterns(log.attributes["message"], "(?:^| )proto=(?P<v>[^ ]+)")["v"], "lower")) where IsMatch(log.attributes["message"], "(?:^| )proto=")'
        - 'set(log.attributes["network.protocol.number"], 6) where log.attributes["network.protocol.name"] == "tcp"'
        - 'set(log.attributes["network.protocol.number"], 17) where log.attributes["network.protocol.name"] == "udp"'
        # Network - Interfaces
        - 'set(log.attributes["network.interface.name"], ExtractPatterns(log.attributes["message"], "(?:^| )inboundifname=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )inboundifname=")'
        # Event Attributes
        - 'set(log.attributes["event.action"], ConvertCase(ExtractPatterns(log.attributes["message"], "(?:^| )act=(?P<v>[^ ]+)")["v"], "lower")) where IsMatch(log.attributes["message"], "(?:^| )act=")'
        - 'set(log.attributes["event.category"], "network") where IsMatch(log.attributes["message"], "(?:^| )event_type=")'
        - 'set(log.attributes["event.type"], ExtractPatterns(log.attributes["message"], "(?:^| )event_type=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )event_type=")'
        # Event - Timestamp (PAN-OS: "Sep 30 2026 07:36:23 GMT")
        - 'set(log.attributes["event.created"], Timestamp(ExtractPatterns(log.attributes["message"], "(?:^| )rt=(?P<v>[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} [A-Za-z]+)")["v"], "MMM dd yyyy HH:mm:ss zzz")) where IsMatch(log.attributes["message"], "(?:^| )rt=")'
        # Service and Host Attributes
        - 'set(log.attributes["service.instance.id"], ExtractPatterns(log.attributes["message"], "(?:^| )dvc=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )dvc=")'
        - 'set(log.attributes["host.name"], ExtractPatterns(log.attributes["message"], "(?:^| )dvc=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )dvc=")'
        # Security Rule Attributes - Palo Alto Rule
        - 'set(log.attributes["security_rule.name"], ExtractPatterns(log.attributes["message"], "(?:^| )rule=(?P<v>[^ ]+)")["v"]) where IsMatch(log.attributes["message"], "(?:^| )rule=")'
        # Traffic Statistics - Network I/O bytes and packets
        - 'set(log.attributes["network.io.bytes.total"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )bytes=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )bytes=")'
        - 'set(log.attributes["network.io.bytes.received"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )bytes_in=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )bytes_in=")'
        - 'set(log.attributes["network.io.bytes.transmitted"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )bytes_out=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )bytes_out=")'
        - 'set(log.attributes["network.io.packets.total"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )packets=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )packets=")'
        - 'set(log.attributes["network.io.packets.received"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )packetsReceived=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )packetsReceived=")'
        - 'set(log.attributes["network.io.packets.transmitted"], Int(ExtractPatterns(log.attributes["message"], "(?:^| )packetsSent=(?P<v>[0-9]+)")["v"])) where IsMatch(log.attributes["message"], "(?:^| )packetsSent=")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "tufin"'
      statements:
        # - 'set(log.attributes["netbox.role.slug"], "policy_management") where log.attributes["netbox.role.slug"] == nil'
        # "policy_management" is no official netbox role
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "f5"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["hw.vendor"], "F5") where log.attributes["hw.vendor"] == nil'
        # NetBox: all F5 devices are Loadbalancer
        - 'set(log.attributes["netbox.role.slug"], "loadbalancer") where log.attributes["netbox.role.slug"] == nil'
        # NetBox platform "F5 TMOS"; default (no F5OS logs in fleet)
        - 'set(log.attributes["netbox.platform.slug"], "f5-tmos") where log.attributes["netbox.platform.slug"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "fortinet"'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "fortinet")'
        - 'set(log.attributes["netbox.platform.slug"], "fortios") where log.attributes["netbox.platform.slug"] == nil'
        # Native FortiOS key=value parsing (relay/rule/connection logs).
        - 'set(log.attributes["_fortios_kv"], ParseKeyValue(log.attributes["message"], " ", "=")) where log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(relay_name=|rule_name=|caddr=|saddr=)")'
        - 'set(log.attributes["subtype"], log.attributes["_fortios_kv"]["subtype"]) where log.attributes["_fortios_kv"] != nil and log.attributes["_fortios_kv"]["subtype"] != nil and log.attributes["subtype"] == nil'
        - 'set(log.attributes["event_type"], log.attributes["_fortios_kv"]["event_type"]) where log.attributes["_fortios_kv"] != nil and log.attributes["_fortios_kv"]["event_type"] != nil and log.attributes["event_type"] == nil'
        - 'set(log.attributes["sap.cc.device.product"], log.attributes["_fortios_kv"]["product"]) where log.attributes["_fortios_kv"] != nil and log.attributes["_fortios_kv"]["product"] != nil and log.attributes["sap.cc.device.product"] == nil'
        - 'delete_key(log.attributes, "_fortios_kv")'
        # CEF format parsing (CEF:0|Fortinet|Fortigate|...).
        - 'set(log.attributes["event_type"], ExtractPatterns(log.attributes["message"], "(?:^|[|\\s])cat=(?P<v>[^:\\s]+)")["v"]) where log.attributes["event_type"] == nil and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(?:^|[|\\s])cat=")'
        - 'set(log.attributes["event.action"], ExtractPatterns(log.attributes["message"], "(?:^|[|\\s])act=(?P<v>\\S+)")["v"]) where log.attributes["event.action"] == nil and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(?:^|[|\\s])act=")'
        - 'set(log.attributes["network.transport"], ExtractPatterns(log.attributes["message"], "(?:^|[|\\s])proto=(?P<v>\\S+)")["v"]) where log.attributes["network.transport"] == nil and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(?:^|[|\\s])proto=")'
        - 'set(log.attributes["msg"], ExtractPatterns(log.attributes["message"], "(?:^|[|\\s])msg=(?P<v>.*?)(?:\\s+\\S+=|$)")["v"]) where log.attributes["msg"] == nil and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(?:^|[|\\s])msg=")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "netapp"'
      statements:
        # Pick a single source to avoid the duplicated message/body double-match.
        # Prefer log.body; fall back to message.
        - 'set(log.attributes["_src"], log.body) where IsMatch(log.body, ".*\\[kern_audit:.*")'
        - 'set(log.attributes["_src"], log.attributes["message"]) where log.attributes["_src"] == nil and IsMatch(log.attributes["message"], ".*\\[kern_audit:.*")'
        # Parse the "::"-delimited ONTAP audit line into a temp map.
        - 'set(log.attributes["_na"], ExtractPatterns(log.attributes["_src"], ":: (?P<node>[^:]+):(?P<iface>ontapi|http) :: (?P<caddr>[0-9a-fA-F.:]+):(?P<cport>\\d+) :: [^:]+:(?P<user>[^:]+?)(?::(?P<role>[^ ]+))? :: (?P<op>.*?) :: (?P<state>Success|Pending|Error|Failure|Failed)\\b.*$")) where log.attributes["_src"] != nil'
        - 'set(log.attributes["client.address"], log.attributes["_na"]["caddr"]) where log.attributes["_na"] != nil and log.attributes["_na"]["caddr"] != nil and log.attributes["client.address"] == nil'
        - 'set(log.attributes["client.port"], Int(log.attributes["_na"]["cport"])) where log.attributes["_na"] != nil and log.attributes["_na"]["cport"] != nil and log.attributes["client.port"] == nil'
        - 'set(log.attributes["user.name"], log.attributes["_na"]["user"]) where log.attributes["_na"] != nil and log.attributes["_na"]["user"] != nil and log.attributes["user.name"] == nil'
        - 'set(log.attributes["user.roles"], [log.attributes["_na"]["role"]]) where log.attributes["_na"] != nil and log.attributes["_na"]["role"] != nil and log.attributes["user.roles"] == nil'
        - 'set(log.attributes["_http"], ExtractPatterns(log.attributes["_na"]["op"], "^(?P<method>GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) (?P<target>\\S+)")) where log.attributes["_na"] != nil and log.attributes["_na"]["iface"] == "http" and log.attributes["_na"]["op"] != nil'
        - 'set(log.attributes["http.request.method"], log.attributes["_http"]["method"]) where log.attributes["_http"] != nil and log.attributes["_http"]["method"] != nil'
        - 'set(log.attributes["url.original"], log.attributes["_http"]["target"]) where log.attributes["_http"] != nil and log.attributes["_http"]["target"] != nil'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["_http"]["target"], "^(?P<url_path>[^?]+)(?:\\?(?P<url_query>.*))?$"), "upsert") where log.attributes["_http"] != nil and log.attributes["_http"]["target"] != nil'
        - 'set(log.attributes["url.path"], log.attributes["url_path"]) where log.attributes["url_path"] != nil and log.attributes["url.path"] == nil'
        - 'set(log.attributes["url.query"], log.attributes["url_query"]) where log.attributes["url_query"] != nil and log.attributes["url.query"] == nil'
        - 'delete_key(log.attributes, "url_path")'
        - 'delete_key(log.attributes, "url_query")'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["_na"]["state"], "(?P<code>\\d{3})"), "upsert") where log.attributes["_na"] != nil and log.attributes["_na"]["state"] != nil and IsMatch(log.attributes["_na"]["state"], ".*\\d{3}.*")'
        - 'set(log.attributes["http.response.status_code"], Int(log.attributes["code"])) where log.attributes["code"] != nil and log.attributes["http.response.status_code"] == nil'
        - 'delete_key(log.attributes, "code")'
        - 'set(log.attributes["event_type"], log.attributes["_na"]["state"]) where log.attributes["_na"] != nil and log.attributes["_na"]["state"] != nil and log.attributes["event_type"] == nil'
        - 'delete_key(log.attributes, "_http")'
        - 'delete_key(log.attributes, "_na")'
        - 'delete_key(log.attributes, "_src")'
        # Classification
        - 'set(log.attributes["netbox.platform.slug"], "netapp-cdot") where log.attributes["netbox.platform.slug"] == nil'
        - 'set(log.attributes["netbox.role.slug"], "filer") where log.attributes["netbox.role.slug"] == nil'
        # there is no matching hw.type-value for these kind of logs, so a custom value "storage" is chosen
        - 'set(log.attributes["hw.type"], "storage") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["hw.vendor"], "NetApp") where log.attributes["hw.vendor"] == nil'
{{- end }}
