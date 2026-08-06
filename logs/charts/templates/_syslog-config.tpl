{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{- define "syslog.receiver" }}
tcp_log/syslog:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.tcp_port }}
  add_attributes: true
  operators:
  # Routes incoming syslog messages based on their header format:
  #   RFC 5424:              "<priority>VERSION timestamp ..." e.g. "<134>1 2026-07-10T09:32:35..."
  #   Cisco IOS:             "<priority>SEQ: HOSTNAME: Mmm dd HH:MM:SS[.ms]: %FACILITY-SEV-MNEMONIC: msg"
  #                          e.g. "<190>137967: eu-de-1-vp101a: Aug  3 13:03:58.869: %SYS-6-..."
  #   RFC 3164 (zero-pad):   "<priority>Mmm 0D HH:MM:SS ..." (NON-STANDARD, Fortinet / Cisco ACI, days 01-09 only)
  #                          e.g. "<44>Aug 05 13:04:13 eu-de-1-fw401a CEF:0|..."
  #   RFC 3164 (standard):   "<priority>Mmm _d HH:MM:SS ..."  e.g. "<13>Jan 15 10:30:00..." or "Aug  5 13:04:44"
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
    # Zero-padded day: only matches days 01-09 (non-standard Fortinet / Cisco ACI).
    # Using "0\d" (not "\d{2}") prevents this route from swallowing standard
    # RFC3164 messages with 2-digit days 10-31, which must reach syslog_3164_parser
    # to keep severity_number / facility / structured appname & proc_id intact.
    # Space-padded single-digit days ("Aug  5") also correctly fall through to the
    # built-in parser, since the char after the space is a space, not "0".
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 0[1-9] "'
      output: syslog_3164_padded_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_3164_parser
    - expr: 'body matches "^<\\d+>\\d{4}-\\d{2}-\\d{2}T"'
      output: syslog_iso_parser
    default: add_format_unknown

  - type: syslog_parser
    id: syslog_5424_parser
    protocol: rfc5424
    on_error: send
    output: add_format_rfc5424
  - type: syslog_parser
    id: syslog_3164_parser
    protocol: rfc3164
    on_error: send
    output: add_format_rfc3164

  # Zero-padded RFC3164 fallback (Fortinet, Cisco ACI, etc.), days 01-09 only.
  # Handles "<pri>Mmm 0D HH:MM:SS HOSTNAME [TAG[PID]:] MESSAGE"
  # The optional appname group only matches "TAG: " or "TAG[PID]: " (colon + whitespace),
  # so payloads like "CEF:0|..." or "%LOG_LOCAL7-2-..." remain in the message field.
  - type: regex_parser
    id: syslog_3164_padded_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{2} \d{2}:\d{2}:\d{2})\s+(?P<hostname>\S+)\s+(?:(?P<appname>[^\s:\[]+)(?:\[(?P<proc_id>\d+)\])?:\s+)?(?P<message>.*)$'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan 02 15:04:05'
      layout_type: gotime
      location: UTC
    output: syslog_3164_padded_cleanup
  - type: remove
    id: syslog_3164_padded_cleanup
    field: attributes.timestamp
    output: add_format_rfc3164_padded

  - type: regex_parser
    id: syslog_iso_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>\d{4}-\d{2}-\d{2}T\S+)\s+(?P<hostname>\S+)\s+(?P<message>.*)'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006-01-02T15:04:05.999999999Z07:00'
      layout_type: gotime
    output: syslog_iso_cleanup
  - type: remove
    id: syslog_iso_cleanup
    field: attributes.timestamp
    output: add_format_iso
  # Cisco IOS format parser
  - type: regex_parser
    id: syslog_cisco_parser
    regex: '^<(?P<priority>\d+)>(?P<sequence>\d+): (?P<hostname>\S+): (?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\d+:\d+:\d+(?:\.\d+)?): (?P<message>.*)'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_cisco_cleanup
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
    id: add_format_iso
    field: attributes.syslog.format
    value: rfc3164_iso8601
    output: add_log_type
  - type: add
    id: add_format_cisco
    field: attributes.syslog.format
    value: cisco_ios
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
  # Same routing logic as tcp_log/syslog. See comments above for format details.
  - type: router
    id: syslog_udp_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_udp_5424_parser
    - expr: 'body matches "^<\\d+>\\d+: \\S+: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_udp_cisco_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 0[1-9] "'
      output: syslog_udp_3164_padded_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_udp_3164_parser
    - expr: 'body matches "^<\\d+>\\d{4}-\\d{2}-\\d{2}T"'
      output: syslog_udp_iso_parser
    default: add_udp_format_unknown
  - type: syslog_parser
    id: syslog_udp_5424_parser
    protocol: rfc5424
    on_error: send
    output: add_udp_format_rfc5424
  - type: syslog_parser
    id: syslog_udp_3164_parser
    protocol: rfc3164
    on_error: send
    output: add_udp_format_rfc3164

  # Zero-padded RFC3164 fallback (UDP), days 01-09 only.
  - type: regex_parser
    id: syslog_udp_3164_padded_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{2} \d{2}:\d{2}:\d{2})\s+(?P<hostname>\S+)\s+(?:(?P<appname>[^\s:\[]+)(?:\[(?P<proc_id>\d+)\])?:\s+)?(?P<message>.*)$'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan 02 15:04:05'
      layout_type: gotime
      location: UTC
    output: syslog_udp_3164_padded_cleanup
  - type: remove
    id: syslog_udp_3164_padded_cleanup
    field: attributes.timestamp
    output: add_udp_format_rfc3164_padded

  - type: regex_parser
    id: syslog_udp_iso_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>\d{4}-\d{2}-\d{2}T\S+)\s+(?P<hostname>\S+)\s+(?P<message>.*)'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006-01-02T15:04:05.999999999Z07:00'
      layout_type: gotime
    output: syslog_udp_iso_cleanup
  - type: remove
    id: syslog_udp_iso_cleanup
    field: attributes.timestamp
    output: add_udp_format_iso
  # Cisco IOS format parser
  - type: regex_parser
    id: syslog_udp_cisco_parser
    regex: '^<(?P<priority>\d+)>(?P<sequence>\d+): (?P<hostname>\S+): (?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\d+:\d+:\d+(?:\.\d+)?): (?P<message>.*)'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_udp_cisco_cleanup
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
    id: add_udp_format_iso
    field: attributes.syslog.format
    value: rfc3164_iso8601
    output: add_udp_log_type
  - type: add
    id: add_udp_format_cisco
    field: attributes.syslog.format
    value: cisco_ios
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
  # Same routing logic as tcp_log/syslog. See comments above for format details.
  - type: router
    id: syslog_tls_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_tls_5424_parser
    - expr: 'body matches "^<\\d+>\\d+: \\S+: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_tls_cisco_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 0[1-9] "'
      output: syslog_tls_3164_padded_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_tls_3164_parser
    - expr: 'body matches "^<\\d+>\\d{4}-\\d{2}-\\d{2}T"'
      output: syslog_tls_iso_parser
    default: add_tls_format_unknown
  - type: syslog_parser
    id: syslog_tls_5424_parser
    protocol: rfc5424
    on_error: send
    output: add_tls_format_rfc5424
  - type: syslog_parser
    id: syslog_tls_3164_parser
    protocol: rfc3164
    on_error: send
    output: add_tls_format_rfc3164

  # Zero-padded RFC3164 fallback (TLS), days 01-09 only.
  - type: regex_parser
    id: syslog_tls_3164_padded_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{2} \d{2}:\d{2}:\d{2})\s+(?P<hostname>\S+)\s+(?:(?P<appname>[^\s:\[]+)(?:\[(?P<proc_id>\d+)\])?:\s+)?(?P<message>.*)$'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan 02 15:04:05'
      layout_type: gotime
      location: UTC
    output: syslog_tls_3164_padded_cleanup
  - type: remove
    id: syslog_tls_3164_padded_cleanup
    field: attributes.timestamp
    output: add_tls_format_rfc3164_padded

  - type: regex_parser
    id: syslog_tls_iso_parser
    regex: '^<(?P<priority>\d+)>(?P<timestamp>\d{4}-\d{2}-\d{2}T\S+)\s+(?P<hostname>\S+)\s+(?P<message>.*)'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: '2006-01-02T15:04:05.999999999Z07:00'
      layout_type: gotime
    output: syslog_tls_iso_cleanup
  - type: remove
    id: syslog_tls_iso_cleanup
    field: attributes.timestamp
    output: add_tls_format_iso
  # Cisco IOS format parser
  - type: regex_parser
    id: syslog_tls_cisco_parser
    regex: '^<(?P<priority>\d+)>(?P<sequence>\d+): (?P<hostname>\S+): (?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\d+:\d+:\d+(?:\.\d+)?): (?P<message>.*)'
    on_error: send
    timestamp:
      parse_from: attributes.timestamp
      layout: 'Jan _2 15:04:05.999999999'
      layout_type: gotime
      location: UTC
    output: syslog_tls_cisco_cleanup
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
    id: add_tls_format_iso
    field: attributes.syslog.format
    value: rfc3164_iso8601
    output: add_tls_log_type
  - type: add
    id: add_tls_format_cisco
    field: attributes.syslog.format
    value: cisco_ios
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
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - transform/syslog_semconv_normalization
    - transform/syslog_drop_legacy_fields
    - transform/truncate_message
    - attributes/cluster
  exporters: [routing/syslog_audit]
{{- end }}
