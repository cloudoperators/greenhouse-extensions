{{- define "syslog.receivers" }}
syslog/udp:
  udp:
    listen_address: "0.0.0.0:{{ .Values.auditLogs.logstashExternal.syslog.port }}"
  protocol: rfc3164

syslog/tcp:
  tcp:
    listen_address: "0.0.0.0:{{ .Values.auditLogs.logstashExternal.syslog.port }}"
  protocol: rfc3164
{{- end }}


{{- define "syslog.processors" }}
transform/syslog_source:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - attributes["log.type"] == "syslog"
      statements:
        - set(attributes["sap.cc.region"], "${region}")
        - set(attributes["sap.cc.cluster"], "${cluster}")
        - set(attributes["sap.cc.audit.source"], "remoteboard") where IsMatch(attributes["hostname"], "^node\\d{2,3}r")
        - set(attributes["sap.cc.audit.source"], "ucsc") where attributes["net.host.ip"] == "10.46.22.24" or attributes["net.host.ip"] == "10.67.75.240"
        - set(attributes["sap.cc.audit.source"], "hsm") where IsMatch(attributes["hostname"], "hsm") or IsMatch(attributes["syslog.hostname"], "hsm")
        - set(attributes["dropped_syslog"], true) where attributes["sap.cc.audit.source"] == nil

filter/dropped_syslog:
  error_mode: ignore
  logs:
    log_record:
      - 'attributes["dropped_syslog"] == true'
{{- end }}


{{- define "syslog.pipeline" }}
logs/syslog:
  receivers: [syslog/udp, syslog/tcp]
  processors: [transform/syslog_source, filter/dropped_syslog, attributes/cluster, batch]
  exporters: [routing]
{{- end }}
