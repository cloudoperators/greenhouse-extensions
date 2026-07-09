{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{- define "syslog.receiver" }}
tcp_log/syslog:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.tcp_port }}
  add_attributes: true
  operators:
  - type: router
    id: syslog_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_5424_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_3164_parser
    default: add_log_type
  - type: syslog_parser
    id: syslog_5424_parser
    protocol: rfc5424
    on_error: send
    output: add_log_type
  - type: syslog_parser
    id: syslog_3164_parser
    protocol: rfc3164
    on_error: send
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
  protocol: rfc3164
  udp:
    listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.udp_port }}
    add_attributes: true
    async: {}
{{- end }}

{{- define "syslog_tls.receiver" }}
tcplog/syslog_tls:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogTLSConfig.tcp_port }}
  add_attributes: true
  tls:
    cert_file: /etc/ssl/syslog-tls/tls.crt
    key_file: /etc/ssl/syslog-tls/tls.key
    {{- if .Values.openTelemetry.externalCollector.syslogTLSConfig.clientCAEnabled }}
    ca_file: /etc/ssl/syslog-tls/ca.crt
    {{- end }}
  operators:
  - type: router
    id: syslog_tls_format_router
    routes:
    - expr: 'body matches "^<\\d+>\\d+ "'
      output: syslog_tls_5424_parser
    - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
      output: syslog_tls_3164_parser
    default: add_tls_log_type
  - type: syslog_parser
    id: syslog_tls_5424_parser
    protocol: rfc5424
    on_error: send
    output: add_tls_log_type
  - type: syslog_parser
    id: syslog_tls_3164_parser
    protocol: rfc3164
    on_error: send
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
