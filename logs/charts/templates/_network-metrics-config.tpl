{{/*
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
*/}}
{{- define "network_metrics.transform" }}
transform/network_metrics_log_level:
  error_mode: ignore
  log_statements:
    # Run after application parsers and preserve levels they already extracted.
    - context: log
      conditions:
        - IsString(resource.attributes["k8s.namespace.name"]) and IsMatch(resource.attributes["k8s.namespace.name"], "^network-metrics") and log.attributes["log.type"] == "containerd" and log.attributes["log.level"] == nil and IsString(log.body)
      statements:
        # Match complete logfmt fields so level= inside a quoted message is ignored.
        - set(log.cache["network_metrics_logfmt"], ExtractPatterns(log.body, "^(?:[^ =\"\\s]+=(?:\"(?:[^\"\\\\]|\\\\.)*\"|[^\\s\"]*)\\s+)*level=\"?(?P<level>(?i:TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL|PANIC))\"?(?:\\s|$)"))
        - set(log.attributes["log.level"], ConvertCase(log.cache["network_metrics_logfmt"]["level"], "lower")) where IsString(log.cache["network_metrics_logfmt"]["level"])
        - set(log.cache["network_metrics_python"], ExtractPatterns(log.body, "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}[,.]\\d+\\s+(?P<level>(?i:TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL|PANIC))(?:\\s|$)")) where log.attributes["log.level"] == nil
        - set(log.attributes["log.level"], ConvertCase(log.cache["network_metrics_python"]["level"], "lower")) where log.attributes["log.level"] == nil and IsString(log.cache["network_metrics_python"]["level"])
        - set(log.cache["network_metrics_json"], ParseJSON(log.body)) where log.attributes["log.level"] == nil and IsMatch(log.body, "^\\s*\\{")
        - set(log.attributes["log.level"], ConvertCase(log.cache["network_metrics_json"]["level"], "lower")) where log.attributes["log.level"] == nil and IsString(log.cache["network_metrics_json"]["level"]) and IsMatch(log.cache["network_metrics_json"]["level"], "^(?i:TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL|PANIC)$")
    - context: log
      conditions:
        - IsString(resource.attributes["k8s.namespace.name"]) and IsMatch(resource.attributes["k8s.namespace.name"], "^network-metrics") and log.attributes["log.type"] == "k8sevents" and log.attributes["log.level"] == nil
      statements:
        - set(log.attributes["log.level"], "warn") where IsMatch(log.severity_text, "^(?i:warning)$")
        - set(log.attributes["log.level"], "info") where IsMatch(log.severity_text, "^(?i:normal)$")
        - set(log.attributes["log.level"], "info") where log.attributes["log.level"] == nil and log.severity_number >= SEVERITY_NUMBER_INFO and log.severity_number < SEVERITY_NUMBER_WARN
        - set(log.attributes["log.level"], "warn") where log.attributes["log.level"] == nil and log.severity_number >= SEVERITY_NUMBER_WARN and log.severity_number < SEVERITY_NUMBER_ERROR
{{- end }}
