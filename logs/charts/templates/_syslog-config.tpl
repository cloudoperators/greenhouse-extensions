{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{- define "syslog.receiver" }}
tcp_log/syslog:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.tcp_port }}
  add_attributes: true
  operators:
  - type: regex_parser
    id: syslog_deframe
    regex: '^(?:\d+ )?(?P<syslogmsg><\d+>.*)$'
    parse_from: body
    on_error: send_quiet
    output: syslog_deframe_check
  - type: router
    id: syslog_deframe_check
    routes:
    - expr: 'attributes.syslogmsg != nil'
      output: syslog_deframe_promote
    default: syslog_double_header_detect
  - type: move
    id: syslog_deframe_promote
    from: attributes.syslogmsg
    to: body
    on_error: send_quiet
    output: syslog_double_header_detect

  # ---------------------------------------------------------------------------
  # Double-header deframing.
  # Some relays prepend their OWN syslog header without removing the device's:
  #   "<PRI>TS RELAY-HOST <PRI>TS DEVICE-HOST ... : message"
  #   e.g. "<123>Sep 04 2026 10:07:34 neo-... <14>Sep  4 10:10:08 derotnp00112: ..."
  # The if-guard requires a SECOND "<PRI>" followed by a real syslog timestamp
  # (ISO 8601, RFC5424 version digit, or a month name), so stray "<n>" tokens in
  # message payloads are NOT mistaken for a header. Single-header logs skip this
  # entirely and reach syslog_format_router with body unchanged.
  # On match: capture the OUTER (relay) hostname, promote the INNER (device)
  # header to body for normal parsing (inner PRI/severity/facility win).
  # ---------------------------------------------------------------------------
  - type: regex_parser
    id: syslog_double_header_detect
    parse_from: body
    if: 'body matches "^<\\d+>[^<]*<\\d+>(?:\\d{4}-\\d{2}-\\d{2}T|\\d+ |(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )"'
    regex: '^(?P<relay_priority><\d+>)(?P<relay_header>[^<]*?)\s+(?P<inner><\d+>.*)$'
    on_error: send_quiet
    output: syslog_double_header_check
  - type: router
    id: syslog_double_header_check
    routes:
    - expr: 'attributes.inner != nil and attributes.inner matches "^<\\d+>"'
      output: syslog_double_header_capture_relay_host
    default: syslog_format_router
  - type: regex_parser
    id: syslog_double_header_capture_relay_host
    parse_from: attributes.relay_header
    regex: '(?P<sap_cc_relay_host_name>\S+)\s*$'
    on_error: send_quiet
    output: syslog_double_header_promote_inner
  - type: move
    id: syslog_double_header_promote_inner
    from: attributes.inner
    to: body
    on_error: send_quiet
    output: syslog_double_header_cleanup_priority
  - type: remove
    id: syslog_double_header_cleanup_priority
    field: attributes.relay_priority
    on_error: send_quiet
    output: syslog_double_header_cleanup_header
  - type: remove
    id: syslog_double_header_cleanup_header
    field: attributes.relay_header
    on_error: send_quiet
    output: syslog_format_router

  # Routes incoming syslog messages based on their header format:
  #   RFC 5424:              "<priority>VERSION timestamp ..." e.g. "<134>1 2026-07-10T09:32:35..."
  #   Cisco IOS:             "<priority>SEQ: HOSTNAME: Mmm dd HH:MM:SS[.ms]: %FACILITY-SEV-MNEMONIC: msg"
  #                          e.g. "<190>137967: eu-de-1-vp101a: Aug  3 13:03:58.869: %SYS-6-..."
  #   Cisco NX-OS (year):    "<priority>HOSTNAME: YYYY Mmm _D HH:MM:SS[.ms] [TZ]: %FAC-SEV-MNEMONIC: msg"
  #                          e.g. "<190>sw-idc-vxo-wdf4-735: 2026 Sep  4 11:55:21.803 met: %LLDP-6-..."
  #   RFC 3164 (1-digit day):"<priority>Mmm  D HH:MM:SS ..." zero-padded ("Aug 06") OR space-padded ("Aug  6"),
  #                          days 1-9 only (Fortinet / Cisco ACI). e.g. "<44>Aug 05 13:04:13 eu-de-1-fw401a CEF:0|..."
  #   RFC 3164 (2-digit day):"<priority>Mmm DD HH:MM:SS ..." days 10-31, handled by built-in parser.
  #                          e.g. "<13>Jan 15 10:30:00..."
  #   RFC 3164 + ISO 8601:   "<priority>YYYY-MM-DDTHH:MM:SS ..." (VMware ESXi/vSAN)
  #                          e.g. "<12>2026-07-10T09:34:11.260Z..."
  #   Unknown:               anything else (no syslog header, continuation lines, garbage)
  - type: router
    id: syslog_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_5424_parser
    - expr: 'body matches "^<\\d+>\\d+: \\S+: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_cisco_parser
    # Cisco NX-OS with leading year, no sequence number.
    - expr: 'body matches "^<\\d+>\\S+: \\d{4} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_nxos_year_parser
    # Non-standard single-digit days: zero-padded ("Aug 06") OR space-padded ("Aug  6"),
    # days 1-9 only. Routed to the regex parser because the built-in RFC3164 parser
    # mishandles these Fortinet/Cisco-ACI style messages (e.g. CEF payloads),
    # dropping the hostname. 2-digit days (10-31) still fall through to the built-in
    # syslog_3164_parser to preserve severity_number / facility / appname / proc_id.
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (0[1-9]| [1-9]) "'
      output: syslog_3164_padded_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_3164_parser
    - expr: 'body matches "^<\\d+>\\d{4}-\\d{2}-\\d{2}T"'
      output: syslog_iso_parser
    default: add_format_unknown

  - type: syslog_parser
    id: syslog_5424_parser
    protocol: rfc5424
    on_error: send_quiet
    output: add_format_rfc5424
  - type: syslog_parser
    id: syslog_3164_parser
    protocol: rfc3164
    on_error: send_quiet
    output: add_format_rfc3164

  # Single-digit-day RFC3164 fallback (Fortinet, Cisco ACI, etc.), days 1-9 only,
  # zero-padded ("Aug 06") or space-padded ("Aug  6"). The "\s+\d{1,2}" in the regex
  # and the "Jan _2" layout tolerate both paddings.
  # Handles "<pri>Mmm  D HH:MM:SS HOSTNAME [TAG[PID]:] MESSAGE"
  # The optional appname group only matches "TAG: " or "TAG[PID]: " (colon + whitespace),
  # so payloads like "CEF:0|..." or "%LOG_LOCAL7-2-..." remain in the message field.
  - type: regex_parser
    id: syslog_3164_padded_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2} \d{2}:\d{2}:\d{2})\s+(?P<hostname>\S+)\s+(?:(?P<appname>[^\s:\[]+)(?:\[(?P<proc_id>\d+)\])?:\s+)?(?P<message>.*)$'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05'
      layout_type: gotime
      location: UTC
    output: syslog_3164_padded_cleanup_guard
  - type: router
    id: syslog_3164_padded_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_3164_padded_cleanup
    default: add_format_rfc3164_padded_failed
  - type: remove
    id: syslog_3164_padded_cleanup
    field: attributes.timestamp
    output: add_format_rfc3164_padded

  # Cisco NX-OS with leading year and optional timezone.
  # Format: <pri>HOSTNAME: YYYY Mmm _D HH:MM:SS[.ms] [TZ]: %...: message
  # The timezone (MET/met/UTC/...) is captured but dropped (Go's reference layout
  # can't reliably parse arbitrary abbreviations); time is treated as UTC.
  # NOTE: MET is UTC+1 - if TZ accuracy matters, this needs a mapping step.
  - type: regex_parser
    id: syslog_nxos_year_parser
    regex: '^<(?P<priority>\d+)>(?P<hostname>\S+): (?P<timestamp>\d{4}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)(?:\s+\S+)?: (?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006 Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_nxos_year_cleanup_guard
  - type: router
    id: syslog_nxos_year_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_nxos_year_cleanup
    default: add_format_nxos_year_failed
  - type: remove
    id: syslog_nxos_year_cleanup
    field: attributes.timestamp
    output: add_format_nxos_year

  - type: regex_parser
    id: syslog_iso_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>\d{4}-\d{2}-\d{2}T\S+)\s+(?P<hostname>\S+)\s+(?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006-01-02T15:04:05.999999999Z07:00'
      layout_type: gotime
    output: syslog_iso_cleanup_guard
  - type: router
    id: syslog_iso_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_iso_cleanup
    default: add_format_iso_failed
  - type: remove
    id: syslog_iso_cleanup
    field: attributes.timestamp
    output: add_format_iso
  # Cisco IOS format parser
  - type: regex_parser
    id: syslog_cisco_parser
    regex: '^<(?P<priority>\d+)>(?P<sequence>\d+): (?P<hostname>\S+): (?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\d+:\d+:\d+(?:\.\d+)?): (?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_cisco_cleanup_guard
  - type: router
    id: syslog_cisco_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_cisco_cleanup
    default: add_format_cisco_failed
  - type: remove
    id: syslog_cisco_cleanup
    field: attributes.timestamp
    output: add_format_cisco
  - type: add
    id: add_format_rfc5424
    field: attributes.syslog.format
    value: rfc5424
    output: add_log_type
  - type: add
    id: add_format_rfc3164
    field: attributes.syslog.format
    value: rfc3164
    output: add_log_type
  - type: add
    id: add_format_rfc3164_padded
    field: attributes.syslog.format
    value: rfc3164_padded
    output: add_log_type
  - type: add
    id: add_format_rfc3164_padded_failed
    field: attributes.syslog.format
    value: rfc3164_padded_failed
    output: add_log_type
  - type: add
    id: add_format_nxos_year
    field: attributes.syslog.format
    value: cisco_nxos_year
    output: add_log_type
  - type: add
    id: add_format_nxos_year_failed
    field: attributes.syslog.format
    value: cisco_nxos_year_failed
    output: add_log_type
  - type: add
    id: add_format_iso
    field: attributes.syslog.format
    value: rfc3164_iso8601
    output: add_log_type
  - type: add
    id: add_format_iso_failed
    field: attributes.syslog.format
    value: rfc3164_iso8601_failed
    output: add_log_type
  - type: add
    id: add_format_cisco
    field: attributes.syslog.format
    value: cisco_ios
    output: add_log_type
  - type: add
    id: add_format_cisco_failed
    field: attributes.syslog.format
    value: cisco_ios_failed
    output: add_log_type
  - type: add
    id: add_format_unknown
    field: attributes.syslog.format
    value: unknown
    output: add_log_type
  - type: add
    id: add_log_type
    field: attributes.log.type
    value: syslogtcp

udp_log/syslog:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.udp_port }}
  add_attributes: true
  async: {}
  operators:
  # Double-header deframing (UDP). See tcp_log/syslog for full explanation.
  - type: regex_parser
    id: syslog_udp_double_header_detect
    parse_from: body
    if: 'body matches "^<\\d+>[^<]*<\\d+>(?:\\d{4}-\\d{2}-\\d{2}T|\\d+ |(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )"'
    regex: '^(?P<relay_priority><\d+>)(?P<relay_header>[^<]*?)\s+(?P<inner><\d+>.*)$'
    on_error: send_quiet
    output: syslog_udp_double_header_check
  - type: router
    id: syslog_udp_double_header_check
    routes:
    - expr: 'attributes.inner != nil and attributes.inner matches "^<\\d+>"'
      output: syslog_udp_double_header_capture_relay_host
    default: syslog_udp_format_router
  - type: regex_parser
    id: syslog_udp_double_header_capture_relay_host
    parse_from: attributes.relay_header
    regex: '(?P<sap_cc_relay_host_name>\S+)\s*$'
    on_error: send_quiet
    output: syslog_udp_double_header_promote_inner
  - type: move
    id: syslog_udp_double_header_promote_inner
    from: attributes.inner
    to: body
    on_error: send_quiet
    output: syslog_udp_double_header_cleanup_priority
  - type: remove
    id: syslog_udp_double_header_cleanup_priority
    field: attributes.relay_priority
    on_error: send_quiet
    output: syslog_udp_double_header_cleanup_header
  - type: remove
    id: syslog_udp_double_header_cleanup_header
    field: attributes.relay_header
    on_error: send_quiet
    output: syslog_udp_format_router

  # Same routing logic as tcp_log/syslog. See comments above for format details.
  - type: router
    id: syslog_udp_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_udp_5424_parser
    - expr: 'body matches "^<\\d+>\\d+: \\S+: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_udp_cisco_parser
    - expr: 'body matches "^<\\d+>\\S+: \\d{4} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_udp_nxos_year_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (0[1-9]| [1-9]) "'
      output: syslog_udp_3164_padded_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_udp_3164_parser
    - expr: 'body matches "^<\\d+>\\d{4}-\\d{2}-\\d{2}T"'
      output: syslog_udp_iso_parser
    default: add_udp_format_unknown
  - type: syslog_parser
    id: syslog_udp_5424_parser
    protocol: rfc5424
    on_error: send_quiet
    output: add_udp_format_rfc5424
  - type: syslog_parser
    id: syslog_udp_3164_parser
    protocol: rfc3164
    on_error: send_quiet
    output: add_udp_format_rfc3164

  - type: regex_parser
    id: syslog_udp_3164_padded_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2} \d{2}:\d{2}:\d{2})\s+(?P<hostname>\S+)\s+(?:(?P<appname>[^\s:\[]+)(?:\[(?P<proc_id>\d+)\])?:\s+)?(?P<message>.*)$'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05'
      layout_type: gotime
      location: UTC
    output: syslog_udp_3164_padded_cleanup_guard
  - type: router
    id: syslog_udp_3164_padded_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_udp_3164_padded_cleanup
    default: add_udp_format_rfc3164_padded_failed
  - type: remove
    id: syslog_udp_3164_padded_cleanup
    field: attributes.timestamp
    output: add_udp_format_rfc3164_padded

  # Cisco NX-OS with leading year (UDP).
  - type: regex_parser
    id: syslog_udp_nxos_year_parser
    regex: '^<(?P<priority>\d+)>(?P<hostname>\S+): (?P<timestamp>\d{4}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)(?:\s+\S+)?: (?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006 Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_udp_nxos_year_cleanup_guard
  - type: router
    id: syslog_udp_nxos_year_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_udp_nxos_year_cleanup
    default: add_udp_format_nxos_year_failed
  - type: remove
    id: syslog_udp_nxos_year_cleanup
    field: attributes.timestamp
    output: add_udp_format_nxos_year

  - type: regex_parser
    id: syslog_udp_iso_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>\d{4}-\d{2}-\d{2}T\S+)\s+(?P<hostname>\S+)\s+(?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006-01-02T15:04:05.999999999Z07:00'
      layout_type: gotime
    output: syslog_udp_iso_cleanup_guard
  - type: router
    id: syslog_udp_iso_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_udp_iso_cleanup
    default: add_udp_format_iso_failed
  - type: remove
    id: syslog_udp_iso_cleanup
    field: attributes.timestamp
    output: add_udp_format_iso
  # Cisco IOS format parser
  - type: regex_parser
    id: syslog_udp_cisco_parser
    regex: '^<(?P<priority>\d+)>(?P<sequence>\d+): (?P<hostname>\S+): (?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\d+:\d+:\d+(?:\.\d+)?): (?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_udp_cisco_cleanup_guard
  - type: router
    id: syslog_udp_cisco_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_udp_cisco_cleanup
    default: add_udp_format_cisco_failed
  - type: remove
    id: syslog_udp_cisco_cleanup
    field: attributes.timestamp
    output: add_udp_format_cisco
  - type: add
    id: add_udp_format_rfc5424
    field: attributes.syslog.format
    value: rfc5424
    output: add_udp_log_type
  - type: add
    id: add_udp_format_rfc3164
    field: attributes.syslog.format
    value: rfc3164
    output: add_udp_log_type
  - type: add
    id: add_udp_format_rfc3164_padded
    field: attributes.syslog.format
    value: rfc3164_padded
    output: add_udp_log_type
  - type: add
    id: add_udp_format_rfc3164_padded_failed
    field: attributes.syslog.format
    value: rfc3164_padded_failed
    output: add_udp_log_type
  - type: add
    id: add_udp_format_nxos_year
    field: attributes.syslog.format
    value: cisco_nxos_year
    output: add_udp_log_type
  - type: add
    id: add_udp_format_nxos_year_failed
    field: attributes.syslog.format
    value: cisco_nxos_year_failed
    output: add_udp_log_type
  - type: add
    id: add_udp_format_iso
    field: attributes.syslog.format
    value: rfc3164_iso8601
    output: add_udp_log_type
  - type: add
    id: add_udp_format_iso_failed
    field: attributes.syslog.format
    value: rfc3164_iso8601_failed
    output: add_udp_log_type
  - type: add
    id: add_udp_format_cisco
    field: attributes.syslog.format
    value: cisco_ios
    output: add_udp_log_type
  - type: add
    id: add_udp_format_cisco_failed
    field: attributes.syslog.format
    value: cisco_ios_failed
    output: add_udp_log_type
  - type: add
    id: add_udp_format_unknown
    field: attributes.syslog.format
    value: unknown
    output: add_udp_log_type
  - type: add
    id: add_udp_log_type
    field: attributes.log.type
    value: syslogudp
{{- end }}

{{- define "syslog_tls.receiver" }}
tcp_log/syslog_tls:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogTLSConfig.tcp_port }}
  add_attributes: true
  tls:
    cert_file: /etc/ssl/syslog-tls/tls.crt
    key_file: /etc/ssl/syslog-tls/tls.key
    {{- if .Values.openTelemetry.externalCollector.syslogTLSConfig.clientCAEnabled }}
    ca_file: /etc/ssl/syslog-tls/ca.crt
    {{- end }}
  operators:
  - type: regex_parser
    id: syslog_tls_deframe
    regex: '^(?:\d+ )?(?P<syslogmsg><\d+>.*)$'
    parse_from: body
    on_error: send_quiet
    output: syslog_tls_deframe_promote
  - type: move
    id: syslog_tls_deframe_promote
    from: attributes.syslogmsg
    to: body
    on_error: send_quiet
    output: syslog_tls_double_header_detect

  # Double-header deframing (TLS). See tcp_log/syslog for full explanation.
  - type: regex_parser
    id: syslog_tls_double_header_detect
    parse_from: body
    if: 'body matches "^<\\d+>[^<]*<\\d+>(?:\\d{4}-\\d{2}-\\d{2}T|\\d+ |(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )"'
    regex: '^(?P<relay_priority><\d+>)(?P<relay_header>[^<]*?)\s+(?P<inner><\d+>.*)$'
    on_error: send_quiet
    output: syslog_tls_double_header_check
  - type: router
    id: syslog_tls_double_header_check
    routes:
    - expr: 'attributes.inner != nil and attributes.inner matches "^<\\d+>"'
      output: syslog_tls_double_header_capture_relay_host
    default: syslog_tls_format_router
  - type: regex_parser
    id: syslog_tls_double_header_capture_relay_host
    parse_from: attributes.relay_header
    regex: '(?P<sap_cc_relay_host_name>\S+)\s*$'
    on_error: send_quiet
    output: syslog_tls_double_header_promote_inner
  - type: move
    id: syslog_tls_double_header_promote_inner
    from: attributes.inner
    to: body
    on_error: send_quiet
    output: syslog_tls_double_header_cleanup_priority
  - type: remove
    id: syslog_tls_double_header_cleanup_priority
    field: attributes.relay_priority
    on_error: send_quiet
    output: syslog_tls_double_header_cleanup_header
  - type: remove
    id: syslog_tls_double_header_cleanup_header
    field: attributes.relay_header
    on_error: send_quiet
    output: syslog_tls_format_router

  # Same routing logic as tcp_log/syslog. See comments above for format details.
  - type: router
    id: syslog_tls_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_tls_5424_parser
    - expr: 'body matches "^<\\d+>\\d+: \\S+: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_tls_cisco_parser
    - expr: 'body matches "^<\\d+>\\S+: \\d{4} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_tls_nxos_year_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (0[1-9]| [1-9]) "'
      output: syslog_tls_3164_padded_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_tls_3164_parser
    - expr: 'body matches "^<\\d+>\\d{4}-\\d{2}-\\d{2}T"'
      output: syslog_tls_iso_parser
    default: add_tls_format_unknown
  - type: syslog_parser
    id: syslog_tls_5424_parser
    protocol: rfc5424
    on_error: send_quiet
    output: add_tls_format_rfc5424
  - type: syslog_parser
    id: syslog_tls_3164_parser
    protocol: rfc3164
    on_error: send_quiet
    output: add_tls_format_rfc3164

  # Single-digit-day RFC3164 fallback (TLS), days 1-9 only, zero- or space-padded.
  - type: regex_parser
    id: syslog_tls_3164_padded_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2} \d{2}:\d{2}:\d{2})\s+(?P<hostname>\S+)\s+(?:(?P<appname>[^\s:\[]+)(?:\[(?P<proc_id>\d+)\])?:\s+)?(?P<message>.*)$'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05'
      layout_type: gotime
      location: UTC
    output: syslog_tls_3164_padded_cleanup_guard
  - type: router
    id: syslog_tls_3164_padded_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_tls_3164_padded_cleanup
    default: add_tls_format_rfc3164_padded_failed
  - type: remove
    id: syslog_tls_3164_padded_cleanup
    field: attributes.timestamp
    output: add_tls_format_rfc3164_padded

  # Cisco NX-OS with leading year (TLS).
  - type: regex_parser
    id: syslog_tls_nxos_year_parser
    regex: '^<(?P<priority>\d+)>(?P<hostname>\S+): (?P<timestamp>\d{4}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)(?:\s+\S+)?: (?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006 Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_tls_nxos_year_cleanup_guard
  - type: router
    id: syslog_tls_nxos_year_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_tls_nxos_year_cleanup
    default: add_tls_format_nxos_year_failed
  - type: remove
    id: syslog_tls_nxos_year_cleanup
    field: attributes.timestamp
    output: add_tls_format_nxos_year

  - type: regex_parser
    id: syslog_tls_iso_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>\d{4}-\d{2}-\d{2}T\S+)\s+(?P<hostname>\S+)\s+(?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006-01-02T15:04:05.999999999Z07:00'
      layout_type: gotime
    output: syslog_tls_iso_cleanup_guard
  - type: router
    id: syslog_tls_iso_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_tls_iso_cleanup
    default: add_tls_format_iso_failed
  - type: remove
    id: syslog_tls_iso_cleanup
    field: attributes.timestamp
    output: add_tls_format_iso
  # Cisco IOS format parser
  - type: regex_parser
    id: syslog_tls_cisco_parser
    regex: '^<(?P<priority>\d+)>(?P<sequence>\d+): (?P<hostname>\S+): (?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\d+:\d+:\d+(?:\.\d+)?): (?P<message>.*)'
    on_error: send_quiet
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_tls_cisco_cleanup_guard
  - type: router
    id: syslog_tls_cisco_cleanup_guard
    routes:
    - expr: 'attributes.timestamp != nil'
      output: syslog_tls_cisco_cleanup
    default: add_tls_format_cisco_failed
  - type: remove
    id: syslog_tls_cisco_cleanup
    field: attributes.timestamp
    output: add_tls_format_cisco
  - type: add
    id: add_tls_format_rfc5424
    field: attributes.syslog.format
    value: rfc5424
    output: add_tls_log_type
  - type: add
    id: add_tls_format_rfc3164
    field: attributes.syslog.format
    value: rfc3164
    output: add_tls_log_type
  - type: add
    id: add_tls_format_rfc3164_padded
    field: attributes.syslog.format
    value: rfc3164_padded
    output: add_tls_log_type
  - type: add
    id: add_tls_format_rfc3164_padded_failed
    field: attributes.syslog.format
    value: rfc3164_padded_failed
    output: add_tls_log_type
  - type: add
    id: add_tls_format_nxos_year
    field: attributes.syslog.format
    value: cisco_nxos_year
    output: add_tls_log_type
  - type: add
    id: add_tls_format_nxos_year_failed
    field: attributes.syslog.format
    value: cisco_nxos_year_failed
    output: add_tls_log_type
  - type: add
    id: add_tls_format_iso
    field: attributes.syslog.format
    value: rfc3164_iso8601
    output: add_tls_log_type
  - type: add
    id: add_tls_format_iso_failed
    field: attributes.syslog.format
    value: rfc3164_iso8601_failed
    output: add_tls_log_type
  - type: add
    id: add_tls_format_cisco
    field: attributes.syslog.format
    value: cisco_ios
    output: add_tls_log_type
  - type: add
    id: add_tls_format_cisco_failed
    field: attributes.syslog.format
    value: cisco_ios_failed
    output: add_tls_log_type
  - type: add
    id: add_tls_format_unknown
    field: attributes.syslog.format
    value: unknown
    output: add_tls_log_type
  - type: add
    id: add_tls_log_type
    field: attributes.log.type
    value: syslogtcptls
{{- end }}

{{- define "syslog.pipeline" }}
logs/syslog_tcp:
  receivers: [tcp_log/syslog]
  processors:
    - filter/syslog_early_drop
    - filter/syslog_drop_verbose
    - transform/syslog_observed_timestamp_fallback
    - transform/syslog_forwarded_by
    - transform/syslog_extract_appname_from_message
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_nsxt
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - transform/syslog_semconv_normalization
    - transform/syslog_drop_legacy_fields
    - transform/truncate_message
    - attributes/cluster
  exporters: [routing/syslog_audit]

logs/syslog_udp:
  receivers: [udp_log/syslog]
  processors:
    - filter/syslog_early_drop
    - filter/syslog_drop_verbose
    - transform/syslog_observed_timestamp_fallback
    - transform/syslog_forwarded_by
    - transform/syslog_extract_appname_from_message
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_nsxt
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - transform/syslog_semconv_normalization
    - transform/syslog_drop_legacy_fields
    - transform/truncate_message
    - attributes/cluster
  exporters: [routing/syslog_audit]
{{- end }}

{{- define "syslog_tls.pipeline" }}
logs/syslog_tcp_tls:
  receivers: [tcp_log/syslog_tls]
  processors:
    - filter/syslog_early_drop
    - filter/syslog_drop_verbose
    - transform/syslog_observed_timestamp_fallback
    - transform/syslog_forwarded_by
    - transform/syslog_extract_appname_from_message
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_nsxt
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - transform/syslog_semconv_normalization
    - transform/syslog_drop_legacy_fields
    - transform/truncate_message
    - attributes/cluster
  exporters: [routing/syslog_audit]
{{- end }}
