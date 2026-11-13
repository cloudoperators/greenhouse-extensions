#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
"""Exercise the rendered network-metrics pipelines using the chart's collector image.

Requires Helm, Docker and PyYAML. Run from any directory:
    python3 logs/charts/ci/test_network_metrics_log_level.py /tmp/network-metrics-test

Synthetic OTLP records supply Kubernetes metadata normally added by the receiver
and k8s_attributes. Application parsers, event consolidation, routing and final
processing come from the rendered chart. Exports go only to Docker's debug output.
"""

import copy
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import yaml

PROCESSOR = "transform/network_metrics_log_level"
LEVELS = ("trace", "debug", "info", "warn", "warning", "error", "fatal", "critical", "panic")


def fixtures():
    cases = []

    def add(name, body, expected=None, namespace="network-metrics", log_type="containerd",
            level=None, severity_text="", severity_number=0, resource=None):
        attrs = {"test.case": name, "log.type": log_type}
        if level is not None:
            attrs["log.level"] = level
        metadata = dict(resource or {})
        if namespace is not None:
            metadata["k8s.namespace.name"] = namespace
        cases.append({"name": name, "body": body, "expected": expected, "attributes": attrs,
                      "resource": metadata, "severity_text": severity_text,
                      "severity_number": severity_number})

    add("blackbox-document", 'time=2026-11-13T20:48:06.408Z level=WARN source=icmp.go:345 '
        'msg="Timeout reading from socket" probe=icmp', "warn")
    add("snmp-prefixed-deployment", 'time=2026-11-13T20:48:06.408Z level=ERROR '
        'source=collector.go:123 msg="SNMP scrape failed"', "error", namespace="network-metrics-sci",
        resource={"k8s.deployment.name": "network-sci-1-0-snmp-exporter"})
    for level in LEVELS:
        add("logfmt-" + level, 'time=2026-11-13T20:48:06Z source=test.go:1 level=' + level.upper()
            + ' msg="synthetic"', level)
    add("level-first", 'level=Info msg="synthetic"', "info")
    add("level-last", 'msg="synthetic" level=DEBUG', "debug")
    add("quoted-level", 'msg="synthetic" level="WaRn" source=test.go:1', "warn")
    add("quoted-prefix", 'msg="text with level=ERROR and spaces" level=INFO', "info")
    add("escaped-quoted-prefix", r'msg="text with \"quotes\" and level=ERROR" level=WARN', "warn")
    add("python-info", "2026-11-13 20:48:06,408 INFO flask.app: serving", "info")
    add("python-warning", "2026-11-13 20:48:06.408 WARNING flask.app: retrying", "warning",
        namespace="network-metrics-sci")
    add("json-error", '{"level":"ERROR","message":"synthetic"}', "error")
    add("json-leading-space", '  {"level":"Info","message":"synthetic"}', "info")
    add("existing-ssh-json", '{"level":"error","message":"synthetic"}', "error",
        resource={"k8s.container.name": "network-generic-ssh-exporter"})
    add("preserve-existing", 'level=DEBUG msg="synthetic"', "ERROR", level="ERROR")
    add("preserve-empty", 'level=DEBUG msg="synthetic"', "", level="")
    add("unrelated-namespace", 'level=ERROR msg="synthetic"', namespace="other")
    add("namespace-suffix-only", 'level=ERROR msg="synthetic"', namespace="other-network-metrics")
    add("missing-namespace", 'level=ERROR msg="synthetic"', namespace=None)
    add("wrong-log-type", 'level=ERROR msg="synthetic"', log_type="journald")
    add("unlabelled-startup", " * Serving Flask app 'network-metrics'")
    add("stderr-without-level", "error connecting to endpoint", resource={"log.iostream": "stderr"})
    add("embedded-level", 'msg="Timeout with level=ERROR" source=test.go:1')
    add("embedded-json-level", '{"message":"level=ERROR"}')
    add("unknown-level", 'level=unknown msg="synthetic"')
    add("json-numeric-level", '{"level":30}')
    add("json-unknown-level", '{"level":"unknown"}')
    add("malformed-json", '{"level":"ERROR"')
    add("map-body", {"level": "ERROR"})
    add("numeric-body", 123)
    add("nil-body", None)
    for text, expected in (("Normal", "info"), ("Warning", "warn")):
        add("event-" + text.lower(), {"type": text}, expected, namespace="network-metrics-sci",
            log_type="k8sevents", severity_text=text)
    for number, expected in ((8, None), (9, "info"), (12, "info"), (13, "warn"), (16, "warn"), (17, None)):
        add("event-number-" + str(number), {"message": "synthetic"}, expected,
            log_type="k8sevents", severity_number=number)
    add("event-existing", {}, "CUSTOM", log_type="k8sevents", level="CUSTOM", severity_text="Warning")
    add("event-unrelated", {}, log_type="k8sevents", namespace="other", severity_text="Warning")
    add("event-no-severity", {"message": "synthetic"}, log_type="k8sevents")
    return cases


def value(item):
    if item is None:
        return {}
    if isinstance(item, str):
        return {"stringValue": item}
    if isinstance(item, int):
        return {"intValue": str(item)}
    if isinstance(item, dict):
        return {"kvlistValue": {"values": attributes(item)}}
    raise TypeError(item)


def attributes(items):
    return [{"key": key, "value": value(item)} for key, item in items.items()]


def payload(cases, source):
    resources = []
    for case in cases:
        event = case["attributes"]["log.type"] == "k8sevents"
        if event != (source == "k8sevents"):
            continue
        metadata = case["resource"].copy()
        attrs = case["attributes"].copy()
        if source == "k8sevents" and "k8s.namespace.name" in metadata:
            # k8s_events emits namespace as a log attribute; the chart moves it.
            attrs["k8s.namespace.name"] = metadata.pop("k8s.namespace.name")
        resources.append({"resource": {"attributes": attributes(metadata)}, "scopeLogs": [{
            "logRecords": [{"body": value(case["body"]), "attributes": attributes(attrs),
                            "severityText": case["severity_text"],
                            "severityNumber": case["severity_number"]}]}]})
    return json.dumps({"resourceLogs": resources}).encode()


def render(chart, overrides):
    tag = yaml.safe_load((chart / "values.yaml").read_text())["openTelemetry"]["collectorImage"]["tag"]
    command = ["helm", "template", "logs", str(chart), "-f", str(chart / "ci/test-values.yaml"),
               "--show-only", "templates/logs-collector.yaml", "--set", "opentelemetry-operator.enabled=false",
               "--set", "customCRDs.enabled=false", "--set", "openTelemetry.externalCollector.enabled=false",
               "--set", "openTelemetry.metricsCollector.enabled=false", "--set", "openTelemetry.logsCollector.kvmConfig.enabled=false",
               "--set", "openTelemetry.logsCollector.cephConfig.enabled=false",
               "--set", "openTelemetry.collectorImage.tag=" + str(tag)]
    for key, val in overrides.items():
        command.extend(["--set", key + "=" + str(val).lower()])
    return yaml.safe_load(subprocess.check_output(command, text=True))


def test_config(manifest):
    original = manifest["spec"]["config"]
    pipelines = {}
    for source in ("containerd", "k8sevents"):
        name = "logs/" + source
        if source == "containerd" and name not in original["service"]["pipelines"]:
            name = "logs/ceph"
        pipeline = copy.deepcopy(original["service"]["pipelines"][name])
        assert pipeline["processors"][-1] == PROCESSOR, source + " must extract after application parsing"
        pipeline["receivers"] = ["otlp/" + source]
        pipeline["processors"] = [p for p in pipeline["processors"] if p not in ("k8s_attributes", "attributes/cluster")]
        pipelines["logs/" + source] = pipeline
    for name, original_pipeline in original["service"]["pipelines"].items():
        if name.startswith("logs/route_"):
            pipeline = copy.deepcopy(original_pipeline)
            pipeline["exporters"] = ["debug"]
            pipelines[name] = pipeline
    used = {processor for pipeline in pipelines.values() for processor in pipeline.get("processors", [])}
    processors = {name: copy.deepcopy(original["processors"][name]) for name in used}
    if "batch" in processors:
        processors["batch"]["timeout"] = "100ms"
    return {"receivers": {"otlp/" + source: {"protocols": {"http": {"endpoint": "0.0.0.0:" + str(port)}}}
                          for source, port in (("containerd", 4318), ("k8sevents", 4319))},
            "processors": processors, "connectors": {"routing": original["connectors"]["routing"]},
            "exporters": {"debug": {"verbosity": "detailed", "use_internal_logger": False}},
            "service": {"telemetry": {"logs": {"level": "warn"}}, "pipelines": pipelines}}


def exported(text):
    records = {}
    for block in re.split(r"(?m)^LogRecord #\d+\s*$", text)[1:]:
        case = re.search(r"(?m)^\s+-> test.case: Str\((.*)\)$", block)
        if case:
            level = re.search(r"(?m)^\s+-> log.level: Str\((.*)\)$", block)
            assert case[1] not in records, "duplicate record " + case[1]
            records[case[1]] = level[1] if level else None
    return records


def run(manifest, work, cases):
    work.mkdir(parents=True, exist_ok=True)
    work.chmod(0o755)
    (work / "rendered.yaml").write_text(yaml.safe_dump(manifest))
    config_path = work / "config.json"
    config_path.write_text(json.dumps(test_config(manifest)))
    config_path.chmod(0o644)
    image = manifest["spec"]["image"]
    container = subprocess.check_output([
        "docker", "run", "-d", "--cap-drop", "ALL", "-p", "127.0.0.1::4318", "-p", "127.0.0.1::4319",
        "-e", "KUBE_NODE_NAME=test-node", "-e", "cluster=test-cluster", "-e", "region=test-region",
        "-v", str(config_path) + ":/test/config.json:ro", image,
        "--feature-gates=transform.flatten.logs", "--config=/test/config.json"], text=True).strip()
    try:
        ports = json.loads(subprocess.check_output([
            "docker", "inspect", "--format", "{{json .NetworkSettings.Ports}}", container], text=True))
        for source, port in (("containerd", 4318), ("k8sevents", 4319)):
            endpoint = "http://127.0.0.1:" + ports[str(port) + "/tcp"][0]["HostPort"] + "/v1/logs"
            deadline = time.monotonic() + 15
            while True:
                try:
                    request = urllib.request.Request(endpoint, payload(cases, source), {"Content-Type": "application/json"})
                    with urllib.request.urlopen(request, timeout=5) as response:
                        result = json.load(response)
                    assert not result.get("partialSuccess"), result
                    break
                except urllib.error.HTTPError:
                    raise
                except OSError:
                    if time.monotonic() >= deadline:
                        raise
                    time.sleep(0.2)
        deadline = time.monotonic() + 10
        while True:
            output = subprocess.run(["docker", "logs", container], capture_output=True, text=True, check=True)
            records = exported(output.stdout + "\n" + output.stderr)
            if len(records) >= len(cases) or time.monotonic() >= deadline:
                break
            time.sleep(0.2)
        (work / "stdout.txt").write_text(output.stdout)
        (work / "stderr.txt").write_text(output.stderr)
        expected = {case["name"]: case["expected"] for case in cases}
        failures = {name: {"expected": level, "actual": records.get(name, "MISSING RECORD")}
                    for name, level in expected.items() if name not in records or records[name] != level}
        assert not failures, json.dumps(failures, indent=2)
        assert records.keys() == expected.keys(), "unexpected exported records"
        print(f"{work.name}: {len(cases)} records passed ({image})", flush=True)
    except Exception:
        output = subprocess.run(["docker", "logs", container], capture_output=True, text=True, check=False)
        (work / "stdout.txt").write_text(output.stdout)
        (work / "stderr.txt").write_text(output.stderr)
        raise
    finally:
        subprocess.run(["docker", "rm", "-f", container], check=True, stdout=subprocess.DEVNULL)


def main():
    chart = Path(__file__).resolve().parents[1]
    work = Path(sys.argv[1]).resolve()
    variants = {
        "standard": {"openTelemetry.logsCollector.openstackConfig.enabled": False},
        "openstack": {"openTelemetry.logsCollector.openstackConfig.enabled": True},
        "ceph-kafka": {"openTelemetry.logsCollector.openstackConfig.enabled": True,
                       "openTelemetry.logsCollector.cephConfig.enabled": True,
                       "openTelemetry.kafka.enabled": True,
                       "openTelemetry.kafka.compression": "none",
                       "openTelemetry.kafka.brokers[0]": "kafka.test:9092",
                       "openTelemetry.logsCollector.kafkaTopic": "logs",
                       "openTelemetry.logsCollector.kafkaStorageTopic": "storage"},
    }
    cases = fixtures()
    for name, overrides in variants.items():
        run(render(chart, overrides), work / name, cases)
    events = render(chart, {"openTelemetry.logsCollector.containerdConfig.enabled": False,
                            "openTelemetry.logsCollector.openstackConfig.enabled": False,
                            "openTelemetry.logsCollector.journaldConfig.enabled": False})["spec"]["config"]
    assert PROCESSOR in events["processors"]
    assert events["service"]["pipelines"]["logs/k8sevents"]["processors"][-1] == PROCESSOR
    print("events-only: processor registration passed", flush=True)


if __name__ == "__main__":
    main()
