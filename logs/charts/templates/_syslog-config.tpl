{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{- define "syslog.receiver" }}
syslog/tcp:
  operators:
  - field: attributes.log.type
    id: syslogtcp
    type: add
    value: syslogtcp
  protocol: rfc5424
  tcp:
    listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.tcp_port }}
    add_attributes: true
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
syslog/tcp-tls:
  operators:
  - field: attributes.log.type
    id: syslogtcptls
    type: add
    value: syslogtcptls
  protocol: rfc5424
  tcp:
    listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogTLSConfig.tcp_port }}
    add_attributes: true
    tls:
      cert_file: /etc/ssl/syslog-tls/tls.crt
      key_file: /etc/ssl/syslog-tls/tls.key
      {{- if .Values.openTelemetry.externalCollector.syslogTLSConfig.clientCAEnabled }}
      ca_file: /etc/ssl/syslog-tls/ca.crt
      {{- end }}
{{- end }}

{{- define "syslog.pipeline" }}
logs/syslog_tcp:
  receivers: [syslog/tcp]
  processors:
    - filter/syslog_early_drop
    - filter/syslog_drop_verbose
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - attributes/cluster
  exporters: [routing/syslog_audit]

logs/syslog_udp:
  receivers: [syslog/udp]
  processors:
    - filter/syslog_early_drop
    - filter/syslog_drop_verbose
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - attributes/cluster
  exporters: [routing/syslog_audit]
{{- end }}

{{- define "syslog_tls.pipeline" }}
logs/syslog_tcp_tls:
  receivers: [syslog/tcp-tls]
  processors:
    - filter/syslog_early_drop
    - filter/syslog_drop_verbose
    - transform/syslog_user_extraction
    - transform/syslog_hostname_parsing
    - transform/syslog_esxi_vm_events
    - transform/syslog_esxi_sshd
    - transform/syslog_audit_classification
    - attributes/cluster
  exporters: [routing/syslog_audit]
{{- end }}
