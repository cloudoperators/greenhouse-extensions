{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "syslog_device_classification.transform" }}
{{/*
  =======================================================================================
  Hardware classification.
  Classifies hardware from syslog message/body content in two stages:
    1. Platform extraction  -> netbox.platform.slug ("cisco-nx-os", "cisco-asa", ) 
    Background: netbox.platform is shared between from VMs (virtualization) and physical devices (dcim).
    2. Per-Platform refinement -> netbox.role.slug, netbox.manufacturer.slug (e.g. Cisco, Check Point, Palo Alto Networks).


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
        - 'log.attributes["netbox.manufacturer.slug"] == nil'
        - 'log.attributes["syslog.format"] == "cisco_ios" or log.attributes["syslog.format"] == "cisco_ios_failed" or log.attributes["syslog.format"] == "cisco_nxos_year" or log.attributes["syslog.format"] == "cisco_nxos_year_failed"'
      statements:
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == nil'
      statements:
        # Check Point (CEF) - contains "(Check Point)". Highest priority.
        - 'set(log.attributes["netbox.manufacturer.slug"], "check-point") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*\\(Check Point\\).*")'
        # Cisco ISE - before Cisco Router (ISE hostnames may contain "-rt##").
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        # Trend Micro - "TrendMicro" AND ("IPSevent"|"IPSaudit").
        - 'set(log.attributes["netbox.manufacturer.slug"], "trend-micro") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*TrendMicro.*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit).*")'
        # Fortinet
        - 'set(log.attributes["netbox.manufacturer.slug"], "fortinet") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Fortinet.*")'
        # Radware (DefensePro / CyberController)
        - 'set(log.attributes["netbox.manufacturer.slug"], "radware") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Radware.*")'
        # Palo Alto Networks - CEF "Palo Alto Networks".
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Palo Alto Networks.*")'
        # Palo Alto Networks - "fw-idc-pan" hostname without literal "palo-alto-networks".
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*fw-idc-pan.*")'
        # Palo Alto Networks - netsplunk IPS (m-ips-sms[1|2|5|6|9|10]) AND (IPSevent|IPSaudit).
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks) where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*m-ips-sms(1|2|5|6|9|10).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit).*")'
        # Palo Alto Networks - netsplunk system/audit events.
        - 'set(log.attributes["netbox.manufacturer.slug"], "palo-alto-networks") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSsystem|SMSsystem|SMSaudit).*")'
        # Cisco ASA firewall - "%ASA-" (leading space preserved).
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        # Check Point gateway daemon logs - (fw|FW-) AND daemon AND NOT "(Check Point)".
        - 'set(log.attributes["netbox.manufacturer.slug"], "check-point") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(fw|FW-).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(last message|clish\\[|xpand\\[|sshd\\[|agetty\\[|auditd\\[|crond\\[|routed\\[|pm\\[|snmpd:|sudo:|kernel:|frontstage:|logger:|spike_detective:|cpviewd:).*")'
        # Cisco Nexus (MAC move / flap events).
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        # Cisco Router - "rt-*" or "*-rt##*" (excludes CISE_Failed_Attempts). After ISE/PAN/Nexus.
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CISE_Failed_Attempts.*")'
        # Cisco Router - "rtb" hostname e.g. "<123>rtb...:".
        - 'set(log.attributes["netbox.manufacturer.slug"], "cisco") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
        # Tufin SecureTrack / TOS Monitoring.
        # Tufin is no official manufacturer in Netbox, but we will handle it like that for now
        - 'set(log.attributes["netbox.manufacturer.slug"], "tufin") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*( SecureTrack: |Tufin SecureTrack, |TOS Monitoring Notification).*")'
        # F5 ASM WAF - "ASM:unit_hostname".
        - 'set(log.attributes["netbox.manufacturer.slug"], "f5") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*ASM:unit_hostname.*")'
        # Unknown manufacturer - broad "attacker" keyword. LAST (only unclassified events reach here).
        - 'set(log.attributes["netbox.role.slug"], "loadbalancer") where log.attributes["netbox.manufacturer.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*attacker.*")'
        - 'set(log.attributes["netbox.manufacturer.slug"], "unknown") where log.attributes["netbox.manufacturer.slug"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "cisco"'
      statements:
        - 'set(log.attributes["netbox.platform.slug"], "cisco-nx-os") where log.attributes["syslog.format"] == "cisco_nxos_year" or log.attributes["syslog.format"] == "cisco_nxos_year_failed"'
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        # Finer device product and role (custom, log-derived).
        - 'set(log.attributes["netbox.platform.slug"], "cisco-ise") where log.attributes["netbox.platform.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        - 'set(log.attributes["netbox.role.slug"], "Authentication Server") where log.attributes["netbox.role.slug"] == nil and log.attributes["netbox.platform.slug"] == "cisco-ise"'
        - 'set(log.attributes["netbox.platform.slug"], "cisco-asa") where log.attributes["netbox.platform.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        - 'set(log.attributes["netbox.role.slug"], "firewall") where log.attributes["netbox.role.slug"] == nil and log.attributes["netbox.platform.slug"] == "cisco-asa"'
        - 'set(log.attributes["netbox.role.slug"], "switch") where log.attributes["netbox.role.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        - 'set(log.attributes["netbox.role.slug"], "router") where log.attributes["netbox.role.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CISE_Failed_Attempts.*")'
        - 'set(log.attributes["netbox.role.slug"], "router") where log.attributes["netbox.role.slug"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "check-point"'
      statements:
        - 'set(log.attributes["netbox.platform.slug"], "check-point-gaia) where log.attributes["netbox.platform.slug"] == nil'
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
        # - 'set(log.attributes["netbox.role.slug"], "policy_management") where log.attributes["netbox.role.slug"] == nil'
        # "policy_management" is no official netbox role
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
    - context: log
      conditions:
        - 'log.attributes["netbox.manufacturer.slug"] == "f5"'
      statements:
        # netbox.platform.slug can be f5os or f5-tmos
        - 'set(log.attributes["netbox.role.slug"], "waf") where log.attributes["netbox.role.slug"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
{{- end }}
