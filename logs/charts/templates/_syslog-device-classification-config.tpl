{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "syslog_device_classification.transform" }}
{{/*
  =======================================================================================
  Hardware classification.
  Classifies hardware from syslog message/body content in two stages:
    1. Manufacturer extraction  -> device.manufacturer (e.g. Cisco, Check Point, Palo Alto Networks).
    2. Per-manufacturer refinement -> hw.type (component category), sap.cc.device.role and
       sap.cc.device.product

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
        - 'log.attributes["device.manufacturer"] == nil'
        - 'log.attributes["syslog.format"] == "cisco_ios" or log.attributes["syslog.format"] == "cisco_ios_failed" or log.attributes["syslog.format"] == "cisco_nxos_year" or log.attributes["syslog.format"] == "cisco_nxos_year_failed"'
      statements:
        - 'set(log.attributes["device.manufacturer"], "Cisco")'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == nil'
      statements:
        # Check Point (CEF) - contains "(Check Point)". Highest priority.
        - 'set(log.attributes["device.manufacturer"], "Check Point") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*\\(Check Point\\).*")'
        # Cisco ISE - before Cisco Router (ISE hostnames may contain "-rt##").
        - 'set(log.attributes["device.manufacturer"], "Cisco") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        # Trend Micro - "TrendMicro" AND ("IPSevent"|"IPSaudit").
        - 'set(log.attributes["device.manufacturer"], "Trend Micro") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*TrendMicro.*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit).*")'
        # Fortinet
        - 'set(log.attributes["device.manufacturer"], "Fortinet") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Fortinet.*")'
        # Radware (DefensePro / CyberController)
        - 'set(log.attributes["device.manufacturer"], "Radware") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Radware.*")'
        # Palo Alto Networks - CEF "Palo Alto Networks".
        - 'set(log.attributes["device.manufacturer"], "Palo Alto Networks") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Palo Alto Networks.*")'
        # Palo Alto Networks - "fw-idc-pan" hostname without literal "Palo Alto Networks".
        - 'set(log.attributes["device.manufacturer"], "Palo Alto Networks") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*fw-idc-pan.*")'
        # Palo Alto Networks - netsplunk IPS (m-ips-sms[1|2|5|6|9|10]) AND (IPSevent|IPSaudit).
        - 'set(log.attributes["device.manufacturer"], "Palo Alto Networks") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*m-ips-sms(1|2|5|6|9|10).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit).*")'
        # Palo Alto Networks - netsplunk system/audit events.
        - 'set(log.attributes["device.manufacturer"], "Palo Alto Networks") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSsystem|SMSsystem|SMSaudit).*")'
        # Cisco ASA firewall - "%ASA-" (leading space preserved).
        - 'set(log.attributes["device.manufacturer"], "Cisco") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        # Check Point gateway daemon logs - (fw|FW-) AND daemon AND NOT "(Check Point)".
        - 'set(log.attributes["device.manufacturer"], "Check Point") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(fw|FW-).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(last message|clish\\[|xpand\\[|sshd\\[|agetty\\[|auditd\\[|crond\\[|routed\\[|pm\\[|snmpd:|sudo:|kernel:|frontstage:|logger:|spike_detective:|cpviewd:).*")'
        # Cisco Nexus (MAC move / flap events).
        - 'set(log.attributes["device.manufacturer"], "Cisco") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        # Cisco Router - "rt-*" or "*-rt##*" (excludes CISE_Failed_Attempts). After ISE/PAN/Nexus.
        - 'set(log.attributes["device.manufacturer"], "Cisco") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CISE_Failed_Attempts.*")'
        # Cisco Router - "rtb" hostname e.g. "<123>rtb...:".
        - 'set(log.attributes["device.manufacturer"], "Cisco") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
        # Tufin SecureTrack / TOS Monitoring.
        - 'set(log.attributes["device.manufacturer"], "Tufin") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*( SecureTrack: |Tufin SecureTrack, |TOS Monitoring Notification).*")'
        # F5 ASM WAF - "ASM:unit_hostname".
        - 'set(log.attributes["device.manufacturer"], "F5") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*ASM:unit_hostname.*")'
        # Unknown manufacturer - broad "attacker" keyword. LAST (only unclassified events reach here).
        - 'set(log.attributes["sap.cc.device.role"], "loadbalancer") where log.attributes["device.manufacturer"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*attacker.*")'
        - 'set(log.attributes["device.manufacturer"], "unknown") where log.attributes["device.manufacturer"] == nil'

    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "Cisco"'
      statements:
        - 'set(log.attributes["os.name"], "Cisco NX-OS") where log.attributes["syslog.format"] == "cisco_nxos_year" or log.attributes["syslog.format"] == "cisco_nxos_year_failed"'
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        # Finer device product and role (custom, log-derived).
        - 'set(log.attributes["sap.cc.device.product"], "Identity Services Engine") where log.attributes["sap.cc.device.product"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        - 'set(log.attributes["sap.cc.device.role"], "authentication-server") where log.attributes["sap.cc.device.role"] == nil and log.attributes["sap.cc.device.product"] == "Identity Services Engine"'
        - 'set(log.attributes["sap.cc.device.product"], "ASA Secure Firewall") where log.attributes["sap.cc.device.product"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        - 'set(log.attributes["sap.cc.device.role"], "firewall") where log.attributes["sap.cc.device.role"] == nil and log.attributes["sap.cc.device.product"] == "ASA Secure Firewall"'
        - 'set(log.attributes["sap.cc.device.role"], "switch") where log.attributes["sap.cc.device.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        - 'set(log.attributes["sap.cc.device.role"], "router") where log.attributes["sap.cc.device.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CISE_Failed_Attempts.*")'
        - 'set(log.attributes["sap.cc.device.role"], "router") where log.attributes["sap.cc.device.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "Check Point"'
      statements:
        - 'set(log.attributes["hw.vendor"], "Check Point") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.device.role"], "firewall") where log.attributes["sap.cc.device.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "Trend Micro"'
      statements:
        - 'set(log.attributes["hw.vendor"], "Trend Micro") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.device.role"], "ips-ids") where log.attributes["sap.cc.device.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "Fortinet"'
      statements:
        - 'set(log.attributes["hw.vendor"], "Fortinet") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.device.role"], "firewall") where log.attributes["sap.cc.device.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "Radware"'
      statements:
        - 'set(log.attributes["hw.vendor"], "Radware") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.device.role"], "ddos-security-appliance") where log.attributes["sap.cc.device.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "Palo Alto Networks"'
      statements:
        - 'set(log.attributes["hw.vendor"], "Palo Alto Networks") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.device.role"], "ips-ids") where log.attributes["sap.cc.device.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit|IPSsystem|SMSsystem|SMSaudit|m-ips-sms).*")'
        - 'set(log.attributes["sap.cc.device.role"], "firewall") where log.attributes["sap.cc.device.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "Tufin"'
      statements:
        - 'set(log.attributes["sap.cc.device.role"], "policy_management") where log.attributes["sap.cc.device.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["device.manufacturer"] == "F5"'
      statements:
        - 'set(log.attributes["hw.vendor"], "F5") where log.attributes["hw.vendor"] == nil'
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.device.role"], "waf") where log.attributes["sap.cc.device.role"] == nil'
{{- end }}
