{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "syslog_hardware_processor.transform" }}
{{/*
  =======================================================================================
  Hardware classification.
  Classifies hardware from syslog message/body content in two stages:
    1. Vendor extraction  -> hw.vendor (e.g. Cisco, Check Point, Palo Alto Networks).
    2. Per-vendor refinement -> hw.type (component category) and sap.cc.hw.role
       (device function/role, e.g. router, firewall, switch, ise).

  Applicable to any hardware category (network, compute, storage, etc.) - the current
  rule set covers network devices, but additional vendors/roles can be added over time.

  Only sets each attribute if not already set (gated by conditions + `== nil` guards).
  OTTL is first-match-wins, so statement ORDER encodes precedence.

  NOTE: Authoritative model/family data (e.g. hw.model like "ASR1002-HX") should come
  from inventory enrichment (NetBox), not regex guessing. This processor only derives
  what the log itself reliably reveals.
  =======================================================================================
*/}}
transform/syslog_hardware_classification:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == nil'
      statements:
        # Check Point (CEF) - contains "(Check Point)". Highest priority.
        - 'set(log.attributes["hw.vendor"], "Check Point") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*\\(Check Point\\).*")'
        # Cisco ISE - before Cisco Router (ISE hostnames may contain "-rt##").
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        # Trend Micro - "TrendMicro" AND ("IPSevent"|"IPSaudit").
        - 'set(log.attributes["hw.vendor"], "Trend Micro") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*TrendMicro.*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit).*")'
        # Fortinet
        - 'set(log.attributes["hw.vendor"], "Fortinet") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Fortinet.*")'
        # Radware (DefensePro / CyberController)
        - 'set(log.attributes["hw.vendor"], "Radware") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Radware.*")'
        # Palo Alto Networks - CEF "Palo Alto Networks".
        - 'set(log.attributes["hw.vendor"], "Palo Alto Networks") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*Palo Alto Networks.*")'
        # Palo Alto Networks - "fw-idc-pan" hostname without literal "Palo Alto Networks".
        - 'set(log.attributes["hw.vendor"], "Palo Alto Networks") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*fw-idc-pan.*")'
        # Palo Alto Networks - netsplunk IPS (m-ips-sms[1|2|5|6|9|10]) AND (IPSevent|IPSaudit).
        - 'set(log.attributes["hw.vendor"], "Palo Alto Networks") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*m-ips-sms(1|2|5|6|9|10).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit).*")'
        # Palo Alto Networks - netsplunk system/audit events.
        - 'set(log.attributes["hw.vendor"], "Palo Alto Networks") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSsystem|SMSsystem|SMSaudit).*")'
        # Cisco ASA firewall - "%ASA-" (leading space preserved).
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        # Check Point gateway daemon logs - (fw|FW-) AND daemon AND NOT "(Check Point)".
        - 'set(log.attributes["hw.vendor"], "Check Point") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(fw|FW-).*") and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(last message|clish\\[|xpand\\[|sshd\\[|agetty\\[|auditd\\[|crond\\[|routed\\[|pm\\[|snmpd:|sudo:|kernel:|frontstage:|logger:|spike_detective:|cpviewd:).*")'
        # Cisco Nexus (MAC move / flap events).
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        # Cisco Router - "rt-*" or "*-rt##*" (excludes CISE_Failed_Attempts). After ISE/PAN/Nexus.
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CISE_Failed_Attempts.*")'
        # Cisco Router - "rtb" hostname e.g. "<123>rtb...:".
        - 'set(log.attributes["hw.vendor"], "Cisco") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
        # Tufin SecureTrack / TOS Monitoring.
        - 'set(log.attributes["hw.vendor"], "Tufin") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*( SecureTrack: |Tufin SecureTrack, |TOS Monitoring Notification).*")'
        # F5 ASM WAF - "ASM:unit_hostname".
        - 'set(log.attributes["hw.vendor"], "F5") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*ASM:unit_hostname.*")'
        # Unknown vendor - broad "attacker" keyword. LAST (only unclassified events reach here).
        - 'set(log.attributes["hw.vendor"], "unknown") where log.attributes["hw.vendor"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*attacker.*")'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "Cisco"'
      statements:
        # Standard component category (pairs with hw.state). All these are network devices.
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        # Finer device role (custom, log-derived).
        - 'set(log.attributes["sap.cc.hw.role"], "ise") where log.attributes["sap.cc.hw.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(ise-(?:saas|idc)|eu-de-2-gmp-prx-1[abc]).*")'
        - 'set(log.attributes["sap.cc.hw.role"], "firewall") where log.attributes["sap.cc.hw.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".* %ASA-.*")'
        - 'set(log.attributes["sap.cc.hw.role"], "switch") where log.attributes["sap.cc.hw.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(SW_MATM-4-MACFLAP_NOTIF|L2FM-4-L2FM_MAC_MOVE2|L2FM-4-L2FM_MAC_MOVE|MAC_MOVE-SP-4-NOTIF|FWM-2-STM_LOOP_DETECT).*")'
        - 'set(log.attributes["sap.cc.hw.role"], "router") where log.attributes["sap.cc.hw.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(rt-[a-zA-Z0-9.\\-]+|\\S+-rt[0-9]{2,}\\S+).*") and not IsMatch(Concat([log.attributes["message"], log.body], " "), ".*CISE_Failed_Attempts.*")'
        - 'set(log.attributes["sap.cc.hw.role"], "router") where log.attributes["sap.cc.hw.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), "<\\d+>rtb\\S+:")'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "Check Point"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "firewall") where log.attributes["sap.cc.hw.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "Trend Micro"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "ips") where log.attributes["sap.cc.hw.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "Fortinet"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "firewall") where log.attributes["sap.cc.hw.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "Radware"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "ddos_protection") where log.attributes["sap.cc.hw.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "Palo Alto Networks"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "ips") where log.attributes["sap.cc.hw.role"] == nil and IsMatch(Concat([log.attributes["message"], log.body], " "), ".*(IPSevent|IPSaudit|IPSsystem|SMSsystem|SMSaudit|m-ips-sms).*")'
        - 'set(log.attributes["sap.cc.hw.role"], "firewall") where log.attributes["sap.cc.hw.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "Tufin"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "policy_management") where log.attributes["sap.cc.hw.role"] == nil'
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "F5"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "waf") where log.attributes["sap.cc.hw.role"] == nil'
    # Unknown vendor - inferred load-balancer role from the "attacker" keyword.
    - context: log
      conditions:
        - 'log.attributes["hw.vendor"] == "unknown"'
      statements:
        - 'set(log.attributes["hw.type"], "network") where log.attributes["hw.type"] == nil'
        - 'set(log.attributes["sap.cc.hw.role"], "load_balancer") where log.attributes["sap.cc.hw.role"] == nil'
{{- end }}
