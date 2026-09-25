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
        - 'set(log.attributes["auditLogCategory"], ExtractPatterns(log.attributes["message"], "(?:^|\\s)(?P<v>CISE_\\S+)")["v"]) where log.attributes["auditLogCategory"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "CISE_")'
        - 'set(log.attributes["act"], ExtractPatterns(log.attributes["message"], "Action=(?P<v>[^,]+?\\S)(?:,|$)")["v"]) where log.attributes["act"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "Action=")'
        - 'set(log.attributes["eventMsg"], ExtractPatterns(log.attributes["message"], "\\d+ NOTICE (?P<v>[^,]+)")["v"]) where log.attributes["eventMsg"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "NOTICE ")'
        - 'set(log.attributes["event_type"], ExtractPatterns(log.attributes["message"], "(?:^|[,\\s])Type=(?P<v>[^,]+)")["v"]) where log.attributes["event_type"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "Type=")'
        - 'set(log.attributes["srcDnsDomain"], ExtractPatterns(log.attributes["message"], "NetworkDeviceName=(?P<v>[^,\\s#]+)")["v"]) where log.attributes["srcDnsDomain"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "NetworkDeviceName=")'
        - 'set(log.attributes["user"], ExtractPatterns(log.attributes["message"], "UserName=(?P<v>[^,]+)")["v"]) where log.attributes["user"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "UserName=")'
        - 'set(log.attributes["remoteIP"], ExtractPatterns(log.attributes["message"], "Remote-Address=(?P<v>[^,]+)")["v"]) where log.attributes["remoteIP"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "Remote-Address=")'
        - 'set(log.attributes["systemPort"], ExtractPatterns(log.attributes["message"], "(?:^|[,\\s])Port=(?P<v>[^,]+)")["v"]) where log.attributes["systemPort"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "Port=")'
        - 'set(log.attributes["cmdSet"], ExtractPatterns(log.attributes["message"], "CmdSet=\\[(?P<v>[^\\]]+)\\]")["v"]) where log.attributes["cmdSet"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "CmdSet=")'
        - 'set(log.attributes["failureReason"], ExtractPatterns(log.attributes["message"], "FailureReason=(?P<v>[^,]+)")["v"]) where log.attributes["failureReason"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise" and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "FailureReason=")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "check-point"'
      statements:
        - 'set(log.attributes["netbox.platform.slug"], "check-point-gaia") where log.attributes["netbox.platform.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil'
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
        # Key value parsing
        - 'set(log.attributes["_kv"], ParseKeyValue(log.attributes["message"], " ", "=")) where log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(relay_name=|rule_name=|caddr=|saddr=)")'
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
        - 'set(log.attributes["sap.cc.device.product"], Int(log.attributes["_kv"]["product"])) where log.attributes["_kv"] != nil and log.attributes["_kv"]["product"] != nil'
        # Drop the temp map so no unscoped raw KV leaks downstream.
        - 'delete_key(log.attributes, "_kv")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "radware"'
      statements:
        - 'set(log.attributes["netbox.platform.slug"], "radwareos") where log.attributes["netbox.platform.slug"] == nil'
        - 'set(log.attributes["netbox.role.slug"], "ddos-security-appliance") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "palo-alto-networks"'
      statements:
        - 'set(log.attributes["netbox.platform.slug"], "pan-os") where log.attributes["netbox.platform.slug"] == nil'
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "tufin"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["hw.vendor"], "Tufin") where log.attributes["hw.vendor"] == nil'

        # event_type + product (mirror the three Logstash message-shape regex tests)
        - 'set(log.attributes["event_type"], "Log") where log.attributes["event_type"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Tufin SecureTrack, .*")'
        - 'set(log.attributes["event_type"], "TOS Notification") where log.attributes["event_type"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*TOS Monitoring Notification.*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".* SecureTrack: .*")'
        - 'set(log.attributes["event_type"], "Audit") where log.attributes["event_type"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* SecureTrack: .*")'
        - 'set(log.attributes["product"], "TOS Monitoring") where log.attributes["product"] == nil and log.attributes["event_type"] == "TOS Notification"'
        - 'set(log.attributes["product"], "SecureTrack") where log.attributes["product"] == nil and log.attributes["event_type"] != nil'

        # Audit fields (message, then body fallback)
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "SecureTrack: (?P<event_reason>.+), Additional Info:(?P<eventMsg>.*) timestamp:(?P<rt>[0-9][0-9.]+ [0-9:]+) UTC"), "upsert") where log.attributes["event_type"] == "Audit" and IsString(log.attributes["message"])'
        - 'merge_maps(log.attributes, ExtractPatterns(log.body, "SecureTrack: (?P<event_reason>.+), Additional Info:(?P<eventMsg>.*) timestamp:(?P<rt>[0-9][0-9.]+ [0-9:]+) UTC"), "upsert") where log.attributes["event_type"] == "Audit" and log.attributes["rt"] == nil and log.body != nil'

        # Log fields: monitored-device variant, then server-only variant
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Tufin SecureTrack, Server (?P<dvchost>[^ (]+)\\((?P<server_fqdn>[^)]*)\\): (?P<monitoredDevice>\\S+) (?P<monitoredIP>[0-9.]+) \\((?P<monitoredID>[0-9]+)\\): (?P<event_reason>.+), Additional Info:(?P<eventMsg>[^,]*),? *timestamp: (?P<rt>[0-9-]+ [0-9:.]+)"), "upsert") where log.attributes["event_type"] == "Log" and log.attributes["rt"] == nil and IsString(log.attributes["message"])'
        - 'merge_maps(log.attributes, ExtractPatterns(log.body, "Tufin SecureTrack, Server (?P<dvchost>[^ (]+)\\((?P<server_fqdn>[^)]*)\\): (?P<monitoredDevice>\\S+) (?P<monitoredIP>[0-9.]+) \\((?P<monitoredID>[0-9]+)\\): (?P<event_reason>.+), Additional Info:(?P<eventMsg>[^,]*),? *timestamp: (?P<rt>[0-9-]+ [0-9:.]+)"), "upsert") where log.attributes["event_type"] == "Log" and log.attributes["rt"] == nil and log.body != nil'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Tufin SecureTrack, Server (?P<dvchost>[^ (]+)\\((?P<server_fqdn>[^)]*)\\): (?P<event_reason>.+), Additional Info: ?(?P<eventMsg>.*)timestamp: (?P<rt>[0-9-]+ [0-9:.]+)"), "upsert") where log.attributes["event_type"] == "Log" and log.attributes["rt"] == nil and IsString(log.attributes["message"])'
        - 'merge_maps(log.attributes, ExtractPatterns(log.body, "Tufin SecureTrack, Server (?P<dvchost>[^ (]+)\\((?P<server_fqdn>[^)]*)\\): (?P<event_reason>.+), Additional Info: ?(?P<eventMsg>.*)timestamp: (?P<rt>[0-9-]+ [0-9:.]+)"), "upsert") where log.attributes["event_type"] == "Log" and log.attributes["rt"] == nil and log.body != nil'

        # TOS Notification: header (message, then body), then variant sub-parse on ocb_temp
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["message"], "Notification Name: (?P<event_name>[^#]+)#012Notification Metric: (?P<event_reason>[^#]+)#012Generated on: (?P<generatedTime>[^#]+)#012Time of Occurrence: (?P<rt>[^#]+)#012Cluster Name: (?P<cluster>[^#]+)#012Node Name: (?P<dvchost>[^#]+)#012(?P<ocb_temp>.*)"), "upsert") where log.attributes["event_type"] == "TOS Notification" and log.attributes["ocb_temp"] == nil and IsString(log.attributes["message"])'
        - 'merge_maps(log.attributes, ExtractPatterns(log.body, "Notification Name: (?P<event_name>[^#]+)#012Notification Metric: (?P<event_reason>[^#]+)#012Generated on: (?P<generatedTime>[^#]+)#012Time of Occurrence: (?P<rt>[^#]+)#012Cluster Name: (?P<cluster>[^#]+)#012Node Name: (?P<dvchost>[^#]+)#012(?P<ocb_temp>.*)"), "upsert") where log.attributes["event_type"] == "TOS Notification" and log.attributes["ocb_temp"] == nil and log.body != nil'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["ocb_temp"], "Partition Name: (?P<partitionName>[^#]+)#012Partition Filesystem Usage: (?P<partitionUsage>[^#]+)#012Notification Status: (?P<status>[^#]+)#012Notification Threshold: (?P<threshold>[^#]+)#012Notification Severity: (?P<severity>[^#]+)#012Notification Description: (?P<eventMsg>.*)"), "upsert") where log.attributes["ocb_temp"] != nil and IsMatch(log.attributes["ocb_temp"], "Partition Filesystem Usage:")'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["ocb_temp"], "Node CPU Usage: (?P<event_metric>[^#]+)#012Notification Status: (?P<status>[^#]+)#012Notification Threshold: (?P<threshold>[^#]+)#012Notification Severity: (?P<severity>[^#]+)#012Notification Description: (?P<eventMsg>.*)"), "upsert") where log.attributes["ocb_temp"] != nil and log.attributes["status"] == nil and log.attributes["event_reason"] != nil and IsMatch(log.attributes["event_reason"], "Node CPU Usage")'
        - 'merge_maps(log.attributes, ExtractPatterns(log.attributes["ocb_temp"], "Partition Name: (?P<partitionName>[^#]+)#012Notification Status: (?P<status>[^#]+)#012Notification Threshold: (?P<threshold>[^#]+)#012Notification Severity: (?P<severity>[^#]+)#012Notification Description: (?P<eventMsg>.*)"), "upsert") where log.attributes["ocb_temp"] != nil and log.attributes["status"] == nil'
        - 'delete_key(log.attributes, "ocb_temp")'

        # Rename onto existing FortLogs conventions (only fields with an existing home)
        - 'set(log.attributes["server.address"], log.attributes["server_fqdn"]) where log.attributes["server.address"] == nil and log.attributes["server_fqdn"] != nil and log.attributes["server_fqdn"] != ""'
        - 'set(log.attributes["server.address"], log.attributes["dvchost"]) where log.attributes["server.address"] == nil and log.attributes["dvchost"] != nil'
        - 'delete_key(log.attributes, "server_fqdn")'
        - 'delete_key(log.attributes, "dvchost")'

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
        - 'set(log.attributes["action_type"], ExtractPatterns(log.attributes["message"], "(?:^|[|\\s])act=(?P<v>\\S+)")["v"]) where log.attributes["action_type"] == nil and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(?:^|[|\\s])act=")'
        - 'set(log.attributes["proto"], ExtractPatterns(log.attributes["message"], "(?:^|[|\\s])proto=(?P<v>\\S+)")["v"]) where log.attributes["proto"] == nil and log.attributes["message"] != nil and IsMatch(log.attributes["message"], "(?:^|[|\\s])proto=")'
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
