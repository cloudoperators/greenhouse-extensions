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
  #   RFC 5424: "<priority>VERSION timestamp ..." e.g. "<134>1 2026-07-10T09:32:35..."
  #   RFC 3164: "<priority>Mmm dd HH:MM:SS ..."  e.g. "<13>Jan 15 10:30:00..."
  #   RFC 3164 with ISO 8601 timestamp (non-standard, used by VMware ESXi/vSAN):
  #             "<priority>ISO-timestamp ..."     e.g. "<12>2026-07-10T09:34:11.260Z..."
  #   Unknown:  anything else (no syslog header, continuation lines, garbage)
  - type: router
    id: syslog_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_5424_parser
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
  - type: add
    id: add_format_rfc5424
    field: attributes.log.syslog.format
    value: rfc5424
    output: add_log_type
  - type: add
    id: add_format_rfc3164
    field: attributes.log.syslog.format
    value: rfc3164
    output: add_log_type
  - type: add
    id: add_format_iso
    field: attributes.log.syslog.format
    value: rfc3164_iso8601
    output: add_log_type
  - type: add
    id: add_format_unknown
    field: attributes.log.syslog.format
    value: unknown
    output: add_log_type
  - type: add
    id: add_log_type
    field: attributes.log.type
    value: syslogtcp
syslog/udp:
  location: UTC
  operators:
  - field: attributes.log.type
    id: syslogudp
    type: add
    value: syslogudp
  - field: attributes.log.syslog.format
    id: syslogudp_format
    type: add
    value: rfc3164
  protocol: rfc3164
  udp:
    listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.udp_port }}
    add_attributes: true
    async: {}
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
  # Routes incoming syslog messages based on their header format:
  #   RFC 5424: "<priority>VERSION timestamp ..." e.g. "<134>1 2026-07-10T09:32:35..."
  #   RFC 3164: "<priority>Mmm dd HH:MM:SS ..."  e.g. "<13>Jan 15 10:30:00..."
  #   RFC 3164 with ISO 8601 timestamp (non-standard, used by VMware ESXi/vSAN):
  #             "<priority>ISO-timestamp ..."     e.g. "<12>2026-07-10T09:34:11.260Z..."
  #   Unknown:  anything else (no syslog header, continuation lines, garbage)
  - type: router
    id: syslog_tls_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_tls_5424_parser
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
  - type: add
    id: add_tls_format_rfc5424
    field: attributes.log.syslog.format
    value: rfc5424
    output: add_tls_log_type
  - type: add
    id: add_tls_format_rfc3164
    field: attributes.log.syslog.format
    value: rfc3164
    output: add_tls_log_type
  - type: add
    id: add_tls_format_iso
    field: attributes.log.syslog.format
    value: rfc3164_iso8601
    output: add_tls_log_type
  - type: add
    id: add_tls_format_unknown
    field: attributes.log.syslog.format
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
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - transform/truncate_message
    - attributes/cluster
  exporters: [routing/syslog_audit]

logs/syslog_udp:
  receivers: [syslog/udp]
  processors:
    - filter/syslog_early_drop
    - filter/syslog_drop_verbose
    - transform/syslog_observed_timestamp_fallback
    - transform/syslog_forwarded_by
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
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
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - transform/truncate_message
    - attributes/cluster
  exporters: [routing/syslog_audit]
{{- end }}
