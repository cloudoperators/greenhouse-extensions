{{/*
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0

Parsing rules for Falco syscall alerts that arrive on the audit ingester
through the external-http webhook path (OCB Logstash -> Kafka), identified by
sap.cc.audit.source == "falco".

Falco events carry the useful fields as a stringified JSON blob in
output_fields_string. This processor parses that blob and promotes the
high-value fields to OTel / FortLogs semantic conventions, maps the Falco
priority to severity, and moves the OCB / Logstash envelope onto the resource.

This is separate from transform/kube_api_audit_parsing (which only handles
Kubernetes API audit events gated on apiVersion ^audit.k8s.io/). Falco events
have no apiVersion and a different field layout, so they get their own pass.

Guards: every statement uses `where ... != nil` so non-Falco records and
re-processing do not error (error_mode: ignore).
*/}}

{{- define "falco.parsing.processor" -}}
transform/falco_parsing:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - attributes["sap.cc.audit.source"] == "falco"
      statements:
        # --- Parse Falco output_fields JSON blob ---
        - set(attributes["output_fields"], ParseJSON(attributes["output_fields_string"])) where attributes["output_fields_string"] != nil
        - delete_key(attributes, "output_fields_string") where attributes["output_fields"] != nil

        # --- Promote the high-value fields to OTel/FortLogs attributes ---
        - set(attributes["k8s.namespace.name"], attributes["output_fields"]["k8s.ns.name"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["k8s.ns.name"] != nil
        - set(attributes["k8s.pod.name"], attributes["output_fields"]["k8s.pod.name"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["k8s.pod.name"] != nil
        - set(attributes["process.command_line"], attributes["output_fields"]["proc.cmdline"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["proc.cmdline"] != nil
        - set(attributes["process.executable.name"], attributes["output_fields"]["proc.name"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["proc.name"] != nil
        - set(attributes["process.executable.path"], attributes["output_fields"]["proc.exepath"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["proc.exepath"] != nil
        - set(attributes["process.parent.name"], attributes["output_fields"]["proc.pname"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["proc.pname"] != nil
        - set(attributes["user.name"], attributes["output_fields"]["user.name"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["user.name"] != nil
        - set(attributes["container.id"], attributes["output_fields"]["container.id"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["container.id"] != nil
        - set(attributes["container.name"], attributes["output_fields"]["container.name"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["container.name"] != nil
        - set(attributes["container.image.name"], attributes["output_fields"]["container.image.repository"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["container.image.repository"] != nil
        - set(attributes["container.image.tag"], attributes["output_fields"]["container.image.tag"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["container.image.tag"] != nil
        - set(attributes["falco.file"], attributes["output_fields"]["fd.name"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["fd.name"] != nil
        - set(attributes["falco.syscall"], attributes["output_fields"]["evt.type"]) where IsMap(attributes["output_fields"]) and attributes["output_fields"]["evt.type"] != nil
        - set(attributes["falco.rule"], attributes["rule"]) where attributes["rule"] != nil
        - delete_key(attributes, "output_fields")

        # --- Map Falco priority to severity ---
        - set(severity_text, attributes["priority"]) where attributes["priority"] != nil
        - set(severity_number, SEVERITY_NUMBER_FATAL) where attributes["priority"] == "Emergency" or attributes["priority"] == "Alert" or attributes["priority"] == "Critical"
        - set(severity_number, SEVERITY_NUMBER_ERROR) where attributes["priority"] == "Error"
        - set(severity_number, SEVERITY_NUMBER_WARN) where attributes["priority"] == "Warning"
        - set(severity_number, SEVERITY_NUMBER_INFO) where attributes["priority"] == "Notice" or attributes["priority"] == "Informational"
        - set(severity_number, SEVERITY_NUMBER_DEBUG) where attributes["priority"] == "Debug"

        # --- Canonical timestamp from Falco event time ---
        - set(time, Time(attributes["time"], "%Y-%m-%dT%H:%M:%S.%fZ")) where attributes["time"] != nil

        # --- Drop noisy fields ---
        - delete_key(attributes, "headers_string")
        - delete_key(attributes, "body")
        - delete_key(attributes, "kubernetes_string")
        - delete_key(attributes, "docker")

        # --- Move OCB / Logstash envelope out of attributes onto the resource ---
        - set(resource.attributes["sap.ocb"], attributes["sap"]["ocb"]) where IsMap(attributes["sap"]) and IsMap(attributes["sap"]["ocb"])
        - delete_key(attributes, "sap") where IsMap(attributes["sap"]) and attributes["sap"]["ocb"] != nil
        - set(resource.attributes["forwarded_by"], attributes["forwarded_by"]) where attributes["forwarded_by"] != nil
        - delete_key(attributes, "forwarded_by")
        - set(resource.attributes["data_stream"], attributes["data_stream"]) where attributes["data_stream"] != nil
        - delete_key(attributes, "data_stream")
        - set(resource.attributes["logstash.tags"], ParseJSON(attributes["tags_string"])) where attributes["tags_string"] != nil
        - delete_key(attributes, "tags_string")
        - set(resource.attributes["logstash.version"], attributes["@version"]) where attributes["@version"] != nil
        - delete_key(attributes, "@version")
        - delete_key(attributes, "@timestamp")
        - delete_key(attributes, "time")
        - set(resource.attributes["host.name"], attributes["hostname"]) where attributes["hostname"] != nil
        - delete_key(attributes, "hostname")
        - set(resource.attributes["k8s.cluster.name"], attributes["sap.cc.cluster"]) where attributes["sap.cc.cluster"] != nil and resource.attributes["k8s.cluster.name"] == nil
        - delete_key(attributes, "sap.cc.cluster")
        - set(resource.attributes["cloud.region"], attributes["sap.cc.region"]) where attributes["sap.cc.region"] != nil and resource.attributes["cloud.region"] == nil
        - delete_key(attributes, "sap.cc.region")
{{- end -}}
