{{/*
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}

{{/*
  syslog.operators
  Renders the shared operator chain used by the TCP, UDP and TLS syslog receivers.
  Params (passed as a dict):
    prefix  - unique id prefix for operator ids (e.g. "syslog", "syslog_udp", "syslog_tls")
    logType - value written to attributes.log.type (e.g. "syslogtcp")
*/}}
{{- define "syslog.operators" -}}
{{- $p := .prefix -}}
{{- $logType := .logType -}}
operators:
# --- Deframe: strip octet-counting frame, promote "<PRI>..." into body -------
- type: regex_parser
  id: {{ $p }}_deframe
  regex: '^(?:\d+ )?(?P<syslogmsg><\d+>.*)$'
  parse_from: body
  on_error: send_quiet
  output: {{ $p }}_deframe_promote
- type: move
  id: {{ $p }}_deframe_promote
  from: attributes.syslogmsg
  to: body
  on_error: send_quiet
  output: {{ $p }}_double_header_detect
# --- Double-header deframing --------------------------------------------------
# Some relays prepend their OWN syslog header without removing the device's:
#   "<PRI>TS RELAY-HOST <PRI>TS DEVICE-HOST ... : message"
#   e.g. "<123>Sep 04 2026 10:07:34 neo-... <14>Sep  4 10:10:08 derotnp00112: ..."
# The if-guard requires a SECOND "<PRI>" followed by a real syslog timestamp
# (ISO 8601, RFC5424 version digit, or a month name), so stray "<n>" tokens in
# message payloads are NOT mistaken for a header. Single-header logs skip this
# entirely and reach the format router with body unchanged.
# On match: capture the OUTER (relay) hostname, promote the INNER (device)
# header to body for normal parsing (inner PRI/severity/facility win).
- type: regex_parser
  id: {{ $p }}_double_header_detect
  parse_from: body
  if: 'body matches "^<\\d+>[^<]*<\\d+>(?:\\d{4}-\\d{2}-\\d{2}T|\\d+ |\\d+: |\\S+: \\d{4} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) |(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )"'
  regex: '^(?P<relay_priority><\d+>)(?P<relay_header>[^<]*?)\s+(?P<inner><\d+>.*)$'
  on_error: send_quiet
  output: {{ $p }}_double_header_check
- type: router
  id: {{ $p }}_double_header_check
  routes:
  - expr: 'attributes.inner != nil and attributes.inner matches "^<\\d+>"'
    output: {{ $p }}_double_header_capture_relay_host
  default: {{ $p }}_format_router
- type: regex_parser
  id: {{ $p }}_double_header_capture_relay_host
  parse_from: attributes.relay_header
  regex: '(?P<syslog_host_name>[A-Za-z0-9][A-Za-z0-9._\-]*):?\s*$'
  on_error: send_quiet
  output: {{ $p }}_double_header_promote_inner
- type: move
  id: {{ $p }}_double_header_promote_inner
  from: attributes.inner
  to: body
  on_error: send_quiet
  output: {{ $p }}_double_header_cleanup_priority
- type: remove
  id: {{ $p }}_double_header_cleanup_priority
  field: attributes.relay_priority
  on_error: send_quiet
  output: {{ $p }}_double_header_cleanup_header
- type: remove
  id: {{ $p }}_double_header_cleanup_header
  field: attributes.relay_header
  on_error: send_quiet
  output: {{ $p }}_format_router
# --- Format router ------------------------------------------------------------
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
#   FortiOS native KV:     "<priority>date=YYYY-MM-DD time=HH:MM:SS devname=..." (native FortiGate key=value)
#                          e.g. "<189>date=2026-09-11 time=19:08:37 devname=\"fw-idc-px-sin9-101\" devid=..."
#   Unknown:               anything else (no syslog header, continuation lines, garbage)
- type: router
  id: {{ $p }}_format_router
  routes:
  - expr: 'body matches "^<\\d+>\\d+ "'
    output: {{ $p }}_5424_parser
  - expr: 'body matches "^<\\d+>\\d+: \\S+: (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
    output: {{ $p }}_cisco_parser
  # Cisco NX-OS with leading year, no sequence number.
  - expr: 'body matches "^<\\d+>\\S+: \\d{4} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
    output: {{ $p }}_nxos_year_parser
  # Non-standard single-digit days: zero-padded ("Aug 06") OR space-padded ("Aug  6"),
  # days 1-9 only. Routed to the regex parser because the built-in RFC3164 parser
  # mishandles these Fortinet/Cisco-ACI style messages (e.g. CEF payloads),
  # dropping the hostname. 2-digit days (10-31) still fall through to the built-in
  # parser to preserve severity_number / facility / appname / proc_id.
  - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (0[1-9]| [1-9]) "'
    output: {{ $p }}_3164_padded_parser
  - expr: 'body matches "^<\\d+>(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"'
    output: {{ $p }}_3164_parser
  - expr: 'body matches "^<\\d+>\\d{4}-\\d{2}-\\d{2}T"'
    output: {{ $p }}_iso_parser
  # FortiOS native key=value: "<pri>date=YYYY-MM-DD time=HH:MM:SS devname=..."
  # No RFC3164/5424 header; timestamp split across date=/time=; hostname in devname=.
  # Distinct from CEF (which begins "CEF:") and from the ISO route (bare timestamp).
  - expr: 'body matches "^<\\d+>date=\\d{4}-\\d{2}-\\d{2} time=\\d{2}:\\d{2}:\\d{2} "'
    output: {{ $p }}_fortios_kv_parser
  default: {{ $p }}_add_format_unknown
# --- Built-in parsers ---------------------------------------------------------
- type: syslog_parser
  id: {{ $p }}_5424_parser
  protocol: rfc5424
  on_error: send_quiet
  output: {{ $p }}_add_format_rfc5424
- type: syslog_parser
  id: {{ $p }}_3164_parser
  protocol: rfc3164
  on_error: send_quiet
  output: {{ $p }}_add_format_rfc3164
# --- RFC3164 single-digit-day fallback (Fortinet, Cisco ACI, etc.) ------------
# Days 1-9 only, zero-padded ("Aug 06") or space-padded ("Aug  6"). The
# "\s+\d{1,2}" in the regex and the "Jan _2" layout tolerate both paddings.
# Handles "<pri>Mmm  D HH:MM:SS HOSTNAME [TAG[PID]:] MESSAGE".
# The optional appname group only matches "TAG: " or "TAG[PID]: " (colon +
# whitespace), so payloads like "CEF:0|..." or "%LOG_LOCAL7-2-..." stay in message.
- type: regex_parser
  id: {{ $p }}_3164_padded_parser
  regex: '^<(?P<priority>\d+)>(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2} \d{2}:\d{2}:\d{2})\s+(?P<hostname>\S+)\s+(?:(?P<appname>[^\s:\[]+)(?:\[(?P<proc_id>\d+)\])?:\s+)?(?P<message>.*)$'
  on_error: send_quiet
  timestamp:
    parse_from: attributes.timestamp
    layout: 'Jan _2 15:04:05'
    layout_type: gotime
    location: UTC
  output: {{ $p }}_3164_padded_cleanup_guard
- type: router
  id: {{ $p }}_3164_padded_cleanup_guard
  routes:
  - expr: 'attributes.timestamp != nil'
    output: {{ $p }}_3164_padded_cleanup
  default: {{ $p }}_add_format_rfc3164_padded_failed
- type: remove
  id: {{ $p }}_3164_padded_cleanup
  field: attributes.timestamp
  output: {{ $p }}_add_format_rfc3164_padded
# --- Cisco NX-OS with leading year and optional timezone ----------------------
# Format: <pri>HOSTNAME: YYYY Mmm _D HH:MM:SS[.ms] [TZ]: %...: message
# The timezone (MET/met/UTC/...) is captured but dropped (Go's reference layout
# can't reliably parse arbitrary abbreviations); time is treated as UTC.
# NOTE: MET is UTC+1 - if TZ accuracy matters, this needs a mapping step.
- type: regex_parser
  id: {{ $p }}_nxos_year_parser
  regex: '^<(?P<priority>\d+)>(?P<hostname>\S+): (?P<timestamp>\d{4}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)(?:\s+\S+)?: (?P<message>.*)'
  on_error: send_quiet
  timestamp:
    parse_from: attributes.timestamp
    layout: '2006 Jan _2 15:04:05.999999999'
    layout_type: gotime
    location: UTC
  output: {{ $p }}_nxos_year_cleanup_guard
- type: router
  id: {{ $p }}_nxos_year_cleanup_guard
  routes:
  - expr: 'attributes.timestamp != nil'
    output: {{ $p }}_nxos_year_cleanup
  default: {{ $p }}_add_format_nxos_year_failed
- type: remove
  id: {{ $p }}_nxos_year_cleanup
  field: attributes.timestamp
  output: {{ $p }}_add_format_nxos_year
# --- RFC3164 + ISO 8601 (VMware ESXi/vSAN) ------------------------------------
- type: regex_parser
  id: {{ $p }}_iso_parser
  regex: '^<(?P<priority>\d+)>(?P<timestamp>\d{4}-\d{2}-\d{2}T\S+)\s+(?P<hostname>\S+)\s+(?P<message>.*)'
  on_error: send_quiet
  timestamp:
    parse_from: attributes.timestamp
    layout: '2006-01-02T15:04:05.999999999Z07:00'
    layout_type: gotime
  output: {{ $p }}_iso_cleanup_guard
- type: router
  id: {{ $p }}_iso_cleanup_guard
  routes:
  - expr: 'attributes.timestamp != nil'
    output: {{ $p }}_iso_cleanup
  default: {{ $p }}_add_format_iso_failed
- type: remove
  id: {{ $p }}_iso_cleanup
  field: attributes.timestamp
  output: {{ $p }}_add_format_iso
# --- Cisco IOS format parser --------------------------------------------------
- type: regex_parser
  id: {{ $p }}_cisco_parser
  regex: '^<(?P<priority>\d+)>(?P<sequence>\d+): (?P<hostname>\S+): (?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s+\d+:\d+:\d+(?:\.\d+)?): (?P<message>.*)'
  on_error: send_quiet
  timestamp:
    parse_from: attributes.timestamp
    layout: 'Jan _2 15:04:05.999999999'
    layout_type: gotime
    location: UTC
  output: {{ $p }}_cisco_cleanup_guard
- type: router
  id: {{ $p }}_cisco_cleanup_guard
  routes:
  - expr: 'attributes.timestamp != nil'
    output: {{ $p }}_cisco_cleanup
  default: {{ $p }}_add_format_cisco_failed
- type: remove
  id: {{ $p }}_cisco_cleanup
  field: attributes.timestamp
  output: {{ $p }}_add_format_cisco
# --- FortiOS native key=value parser ------------------------------------------
# Format: <pri>date=YYYY-MM-DD time=HH:MM:SS devname="HOST" devid=... eventtime=...
#         tz="+HHMM" logid=... type=... ... (space-separated key=value pairs)
# Extracts: priority, hostname (from devname=), and the FULL payload as message
# (payload retained so downstream key extraction / classification still works).
# The timestamp is built from date= + time= into a single "timestamp" field and
# parsed with a gotime layout. tz= (position varies) is captured separately and
# appended so the offset is honored; if absent, time is treated as UTC.
# Field ORDER assumption: FortiOS native emits "date time devname ..." leading.
# VERIFY across log types (traffic/utm/event) that this ordering holds.
- type: regex_parser
  id: {{ $p }}_fortios_kv_parser
  regex: '^<(?P<priority>\d+)>date=(?P<fdate>\d{4}-\d{2}-\d{2}) time=(?P<ftime>\d{2}:\d{2}:\d{2}) (?P<message>devname=.*)$'
  on_error: send_quiet
  output: {{ $p }}_fortios_kv_extract_host
# Capture devname= as hostname (quoted or unquoted). Non-fatal if absent.
- type: regex_parser
  id: {{ $p }}_fortios_kv_extract_host
  parse_from: attributes.message
  regex: '^devname="?(?P<hostname>[^"\s]+)"?'
  on_error: send_quiet
  output: {{ $p }}_fortios_kv_extract_tz
# Capture tz= offset from anywhere in the payload (position varies). Non-fatal.
- type: regex_parser
  id: {{ $p }}_fortios_kv_extract_tz
  parse_from: attributes.message
  regex: 'tz="?(?P<ftz>[+-]\d{4})"?'
  on_error: send_quiet
  output: {{ $p }}_fortios_kv_default_tz
# Default tz to +0000 when not present so the combined layout always parses.
- type: add
  id: {{ $p }}_fortios_kv_default_tz
  field: attributes.ftz
  value: "+0000"
  if: 'attributes.ftz == nil'
  output: {{ $p }}_fortios_kv_build_ts
# Build a single parseable timestamp string: "YYYY-MM-DD HH:MM:SS +HHMM".
- type: add
  id: {{ $p }}_fortios_kv_build_ts
  field: attributes.fts
  value: 'EXPR(attributes.fdate + " " + attributes.ftime + " " + attributes.ftz)'
  output: {{ $p }}_fortios_kv_ts_parse
# Parse the combined timestamp. On failure the log still proceeds (send_quiet)
# and observed_time is used downstream via transform/syslog_observed_timestamp_fallback.
- type: time_parser
  id: {{ $p }}_fortios_kv_ts_parse
  parse_from: attributes.fts
  layout: '2006-01-02 15:04:05 -0700'
  layout_type: gotime
  on_error: send_quiet
  output: {{ $p }}_fortios_kv_cleanup_fts
# Cleanup intermediate timestamp-building attributes (best-effort).
- type: remove
  id: {{ $p }}_fortios_kv_cleanup_fts
  field: attributes.fts
  on_error: send_quiet
  output: {{ $p }}_fortios_kv_cleanup_fdate
- type: remove
  id: {{ $p }}_fortios_kv_cleanup_fdate
  field: attributes.fdate
  on_error: send_quiet
  output: {{ $p }}_fortios_kv_cleanup_ftime
- type: remove
  id: {{ $p }}_fortios_kv_cleanup_ftime
  field: attributes.ftime
  on_error: send_quiet
  output: {{ $p }}_fortios_kv_cleanup_ftz
- type: remove
  id: {{ $p }}_fortios_kv_cleanup_ftz
  field: attributes.ftz
  on_error: send_quiet
  output: {{ $p }}_add_format_fortios_kv
# --- Format taggers (all converge on add_log_type) ----------------------------
{{- range $id, $val := dict
      "add_format_rfc5424"               "rfc5424"
      "add_format_rfc3164"               "rfc3164"
      "add_format_rfc3164_padded"        "rfc3164_padded"
      "add_format_rfc3164_padded_failed" "rfc3164_padded_failed"
      "add_format_nxos_year"             "cisco_nxos_year"
      "add_format_nxos_year_failed"      "cisco_nxos_year_failed"
      "add_format_iso"                   "rfc3164_iso8601"
      "add_format_iso_failed"            "rfc3164_iso8601_failed"
      "add_format_cisco"                 "cisco_ios"
      "add_format_cisco_failed"          "cisco_ios_failed"
      "add_format_fortios_kv"            "fortios_kv"
      "add_format_fortios_kv_failed"     "fortios_kv_failed"
      "add_format_unknown"               "unknown" }}
- type: add
  id: {{ $p }}_{{ $id }}
  field: attributes.syslog.format
  value: {{ $val }}
  output: {{ $p }}_add_log_type
{{- end }}
- type: add
  id: {{ $p }}_add_log_type
  field: attributes.log.type
  value: {{ $logType }}
{{- end -}}

{{- define "syslog.receiver" }}
tcp_log/syslog:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.tcp_port }}
  add_attributes: true
  {{- include "syslog.operators" (dict "prefix" "syslog" "logType" "syslogtcp") | nindent 2 }}

udp_log/syslog:
  listen_address: 0.0.0.0:{{ .Values.openTelemetry.externalCollector.syslogConfig.udp_port }}
  add_attributes: true
  async: {}
  {{- include "syslog.operators" (dict "prefix" "syslog_udp" "logType" "syslogudp") | nindent 2 }}
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
  {{- include "syslog.operators" (dict "prefix" "syslog_tls" "logType" "syslogtcptls") | nindent 2 }}
{{- end }}

{{/*
  syslog.pipeline.processors
  The shared processor chain for every syslog logs pipeline.
*/}}
{{- define "syslog.pipeline.processors" -}}
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
  - transform/syslog_device_classification
  - transform/syslog_audit_classification
  - transform/syslog_semconv_normalization
  - transform/syslog_drop_legacy_fields
  - transform/truncate_message
  - attributes/cluster
{{- end -}}

{{/*
  syslog.pipeline.def
  Renders one "logs/<name>" pipeline block.
  Params (dict): name, receiver
*/}}
{{- define "syslog.pipeline.def" -}}
logs/{{ .name }}:
  receivers: [{{ .receiver }}]
  {{- include "syslog.pipeline.processors" . | nindent 2 }}
  exporters: [routing/syslog_audit]
{{- end -}}

{{- define "syslog.pipeline" }}
{{- range $pl := list
      (dict "name" "syslog_tcp" "receiver" "tcp_log/syslog")
      (dict "name" "syslog_udp" "receiver" "udp_log/syslog") }}
{{ include "syslog.pipeline.def" $pl }}
{{- end }}
{{- end }}

{{- define "syslog_tls.pipeline" }}
{{- range $pl := list
      (dict "name" "syslog_tcp_tls" "receiver" "tcp_log/syslog_tls") }}
{{ include "syslog.pipeline.def" $pl }}
{{- end }}
{{- end }}
