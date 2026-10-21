#!/usr/bin/env python3
"""Run the rendered file_log/kube_audit receiver, transform/kube_audit and the
credential-removal route of the audit-logs chart in the collector image.

The input is the rendered OpenTelemetryCollector manifest (JSON): the collector
image is read from .spec.image and the pipeline from .spec.config, so the test
always runs against the image the chart actually ships. Render it with:

    helm template audit-logs . -f ci/test-values.yaml \
        --api-versions monitoring.coreos.com/v1 \
        --set 'auditLogs.logsCollector.selflogging.include={/var/log/pods/*/*/*.log}' \
        | yq -o=json 'select(.kind == "OpenTelemetryCollector")' > otelcol.json

Fixtures: the 27 events of sapcc/helm-charts#13008 (system/audit-logs/ci/test-audit-filters.py),
plus runtime extras. Expectations follow the runtime filter: it also removes the
mutation.webhook annotations, removes .data from bodies it keeps, never marks for
patch annotations alone, and (since #2166) flattens any kept requestObject/responseObject
to a JSON string attribute requestObject_string/responseObject_string.

Usage: test_kube_audit.py <rendered OpenTelemetryCollector as JSON> <work dir> [--expect-fail]
"""

import copy
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


STAMP = "2026-01-01T12:00:00.000000Z"
SECRET = "SYNTHETIC_CREDENTIAL_MUST_BE_REMOVED"
PATCH_PREFIX = "patch.webhook.admission.k8s.io/"
MARKER = "sap.cc.audit.credential_body_removed"
MUTATION = "mutation.webhook.admission.k8s.io/round_0_index_0"
ANNOTATIONS = {
    "shoot.gardener.cloud/name": "review-qa-de-1",
    "seed.gardener.cloud/name": "review-seed",
    "authorization.k8s.io/decision": "allow",
    MUTATION: '{"mutated":true}',
}
# The runtime filter removes the mutation annotations too.
EXPECTED_ANNOTATIONS = {k: v for k, v in ANNOTATIONS.items() if k != MUTATION}

REQUEST, RESPONSE = ("requestObject",), ("responseObject",)
BOTH = REQUEST + RESPONSE
DELETE_OPTIONS = {"kind": "DeleteOptions", "apiVersion": "meta.k8s.io/v1", "propagationPolicy": "Background"}
TOKEN_REQUEST = {"spec": {"audiences": ["review"], "expirationSeconds": 3600}}
KUBECONFIG_REQUEST = {"spec": {"expirationSeconds": 600}}


def fixtures():
    cases = []

    def add(name, resource=None, subresource=None, verb="create", request=None, response=None,
            removed=(), marked=False, patch=False):
        event = {
            "kind": "Event", "apiVersion": "audit.k8s.io/v1", "auditID": name,
            "level": "RequestResponse" if response is not None else "Request" if request is not None else "Metadata",
            "stage": "ResponseComplete", "verb": verb,
            "requestReceivedTimestamp": STAMP, "stageTimestamp": STAMP,
            "user": {"username": "synthetic-review"}, "annotations": copy.deepcopy(ANNOTATIONS),
        }
        if resource:
            event["objectRef"] = {"resource": resource, "name": "synthetic", "namespace": "review"}
            if subresource:
                event["objectRef"]["subresource"] = subresource
        if request is not None:
            event["requestObject"] = request
        if response is not None:
            event["responseObject"] = response
        if patch:
            for suffix in ("round_0_index_0", "round_1_index_2"):
                event["annotations"][PATCH_PREFIX + suffix] = json.dumps({
                    "patchType": "JSONPatch", "patch": [{"op": "add", "path": "/data/password", "value": SECRET}],
                })
        cases.append((event, set(removed), marked))

    # --- the 27 events of helm-charts#13008 ---
    add("secret-create", "secrets", request={"stringData": {"password": SECRET}, "metadata": {
        "annotations": {"kubectl.kubernetes.io/last-applied-configuration": SECRET}}}, removed=REQUEST, marked=True)
    add("secret-get", "secrets", verb="get", response={"data": {"password": SECRET}}, removed=RESPONSE, marked=True)
    add("secret-list", "secrets", verb="list", response={"items": [{"data": {"password": SECRET}}]}, removed=RESPONSE, marked=True)
    add("secret-json-patch", "secrets", verb="patch", request=[{"op": "add", "path": "/data/password", "value": SECRET}],
        removed=REQUEST, marked=True)
    add("secret-delete", "secrets", verb="delete", request=DELETE_OPTIONS)
    add("secret-delete-response", "secrets", verb="delete", request=DELETE_OPTIONS, response={"data": {"password": SECRET}},
        removed=RESPONSE, marked=True)
    for resource in ("bmcsecrets", "internalsecrets"):
        add(resource, resource, request={"data": {"password": SECRET}}, removed=REQUEST, marked=True)
    add("token-review", "tokenreviews", request={"spec": {"token": SECRET}}, removed=BOTH, marked=True)
    add("sa-token", "serviceaccounts", "token", response={"status": {"token": SECRET}}, removed=RESPONSE, marked=True)
    add("sa-token-request", "serviceaccounts", "token", request=TOKEN_REQUEST)
    add("sa-token-request-response", "serviceaccounts", "token", request=TOKEN_REQUEST,
        response={"status": {"token": SECRET}}, removed=RESPONSE, marked=True)
    add("workload-token", "workloadidentities", "token", response={"status": {"token": SECRET}}, removed=RESPONSE, marked=True)
    for subresource in ("adminkubeconfig", "viewerkubeconfig"):
        add(subresource, "shoots", subresource, response={"status": {"kubeconfig": SECRET}}, removed=RESPONSE, marked=True)
        add(subresource + "-request", "shoots", subresource, request=KUBECONFIG_REQUEST)
    add("body-and-annotations", "secrets", request={"data": {"password": SECRET}}, removed=REQUEST, marked=True, patch=True)
    # Runtime difference: patch annotations alone never mark (unchanged since #1605). kube-apiserver
    # records them only at Request level, where a Secret write's own request body marks the event.
    add("annotations-only", "secrets", marked=False, patch=True)
    add("token-request-annotations", "serviceaccounts", "token", request=TOKEN_REQUEST, patch=True)
    add("pod-annotations", "pods", request={"spec": {"containers": []}}, patch=True)
    add("shoot-update-annotations", "shoots", verb="update", request={"spec": {"purpose": "evaluation"}}, patch=True)
    add("metadata-control", "secrets")
    add("shoot-control", "shoots", request={"spec": {"purpose": "testing"}})
    add("configmap-control", "configmaps", request={"data": {"safe": "value"}})
    add("rbac-json-patch", "clusterrolebindings", request=[{"op": "add", "path": "/subjects/-", "value": {"name": "review"}}])
    add("non-resource-control")
    # --- runtime extras ---
    add("secret-update", "secrets", verb="update", request={"data": {"password": SECRET}},
        response={"data": {"password": SECRET}}, removed=BOTH, marked=True)
    add("secret-deletecollection", "secrets", verb="deletecollection", request=DELETE_OPTIONS)
    add("secret-deletecollection-response", "secrets", verb="deletecollection", request=DELETE_OPTIONS,
        response={"items": [{"data": {"password": SECRET}}]}, removed=RESPONSE, marked=True)
    add("internalsecrets-delete", "internalsecrets", verb="delete", request=DELETE_OPTIONS)
    add("token-review-response", "tokenreviews", request={"spec": {"token": SECRET}},
        response={"spec": {"token": SECRET}, "status": {"authenticated": True}}, removed=BOTH, marked=True)
    add("configmap-get", "configmaps", verb="get", response={"data": {"safe": "value"}})
    return cases


def expected_string(before, key, removed):
    """What the runtime should keep, since #2166: a kept body is flattened to a JSON
    string attribute (requestObject_string/responseObject_string) with .data removed
    from maps. A removed (credential) body leaves no string attribute at all."""
    if key in removed or key not in before:
        return None
    body = copy.deepcopy(before[key])
    if isinstance(body, dict):
        body.pop("data", None)
    # OTTL String() renders maps/slices as compact JSON with sorted keys.
    return json.dumps(body, separators=(",", ":"), sort_keys=True)


LINE = re.compile(r"^\s+-> (\S+?): (Str|Bool|Int|Double|Map|Slice|Bytes|Empty)\((.*)\)$")


def parse_debug(text):
    """LogRecords from the debug exporter's detailed output, as attribute dicts."""
    records, current = [], None
    for line in text.splitlines():
        if line.startswith("LogRecord #"):
            current = {}
            records.append(current)
            continue
        if current is None:
            continue
        m = LINE.match(line)
        if not m:
            continue
        key, kind, raw = m.groups()
        if kind in ("Map", "Slice"):
            value = json.loads(raw)
        elif kind == "Bool":
            value = raw == "true"
        elif kind == "Int":
            value = int(raw)
        elif kind == "Empty":
            value = None
        else:
            value = raw
        current[key] = value
    return records


def build_config(config, cases):
    cfg = copy.deepcopy(config)
    receiver = copy.deepcopy(cfg["receivers"]["file_log/kube_audit"])
    receiver["include"] = ["/review/audit.log"]
    receiver["start_at"] = "beginning"
    return {
        "receivers": {"file_log/kube_audit": receiver},
        "processors": {"transform/kube_audit": cfg["processors"]["transform/kube_audit"]},
        "connectors": {"routing/credential_body_removed": cfg["connectors"]["routing/credential_body_removed"]},
        "exporters": {
            "debug/out": {"verbosity": "detailed", "use_internal_logger": False},
            "debug/credential_body_removed": cfg["exporters"]["debug/credential_body_removed"],
        },
        "service": {
            "telemetry": {
                "logs": {"level": "warn", "output_paths": ["stderr"], "error_output_paths": ["stderr"]},
                "metrics": {"level": "detailed", "readers": [{"pull": {"exporter": {"prometheus": {
                    "host": "0.0.0.0", "port": 8888, "without_type_suffix": False}}}}]},
                "resource": {"attributes": [{"name": "k8s_cluster_name", "value": "review"},
                                             {"name": "k8s_node_name", "value": "review-node"}]},
            },
            "pipelines": {
                "logs/kube_audit": {"receivers": ["file_log/kube_audit"], "processors": ["transform/kube_audit"],
                                    "exporters": ["debug/out", "routing/credential_body_removed"]},
                "logs/credential_body_removed": {"receivers": ["routing/credential_body_removed"],
                                                 "exporters": ["debug/credential_body_removed"]},
            },
        },
    }


def metric(text, name, **labels):
    total, found = 0.0, False
    for line in text.splitlines():
        if not line.startswith(name + "{"):
            continue
        if all(f'{k}="{v}"' in line for k, v in labels.items()):
            total += float(line.rsplit(" ", 1)[1])
            found = True
    return total if found else None


def main():
    rendered, work = sys.argv[1], Path(sys.argv[2])
    manifest = json.loads(Path(rendered).read_text())
    image = manifest["spec"]["image"]
    config = manifest["spec"]["config"]
    work.mkdir(parents=True, exist_ok=True)
    work.chmod(0o755)
    cases = fixtures()
    (work / "audit.log").write_text("".join(json.dumps(e) + "\n" for e, _, _ in cases))
    (work / "config.yaml").write_text(json.dumps(build_config(config, cases), indent=1))
    (work / "audit.log").chmod(0o644)
    (work / "config.yaml").chmod(0o644)
    print(f"collector image: {image}")
    name = f"kube-audit-test-{int(time.time())}"
    subprocess.run(["docker", "run", "-d", "--name", name, "--platform", "linux/amd64", "--cap-drop", "ALL",
                    "-p", "127.0.0.1:18888:8888", "-v", f"{work}:/review:ro", image,
                    "--config=/review/config.yaml"], check=True, capture_output=True)
    metrics = ""
    try:
        deadline = time.time() + 90
        while time.time() < deadline:
            time.sleep(2)
            try:
                metrics = urllib.request.urlopen("http://127.0.0.1:18888/metrics", timeout=5).read().decode()
            except OSError:
                continue
            sent = metric(metrics, "otelcol_exporter_sent_log_records_total", exporter="debug/out")
            if sent is not None and sent >= len(cases):
                time.sleep(3)
                metrics = urllib.request.urlopen("http://127.0.0.1:18888/metrics", timeout=5).read().decode()
                break
        logs = subprocess.run(["docker", "logs", name], capture_output=True, text=True)
    finally:
        subprocess.run(["docker", "rm", "-f", name], capture_output=True)
    (work / "stdout.txt").write_text(logs.stdout)
    (work / "stderr.txt").write_text(logs.stderr)
    (work / "metrics.txt").write_text(metrics)

    failures = []
    if SECRET in logs.stdout or SECRET in logs.stderr:
        leaked = sorted({r.get("auditID") for r in parse_debug(logs.stdout) if SECRET in json.dumps(r)})
        failures.append(f"credential in output: {leaked}")
    records = {r.get("auditID"): r for r in parse_debug(logs.stdout)}
    if len(records) != len(cases):
        failures.append(f"expected {len(cases)} records, got {len(records)}")
    for before, removed, marked in cases:
        aid = before["auditID"]
        event = records.get(aid)
        if event is None:
            failures.append(f"{aid}: missing")
            continue
        if event.get("annotations") != EXPECTED_ANNOTATIONS:
            failures.append(f"{aid}: annotations {event.get('annotations')}")
        if event.get(MARKER) is not (True if marked else None):
            failures.append(f"{aid}: marker {event.get(MARKER)!r}, expected {marked}")
        for key in ("requestObject", "responseObject"):
            # Since #2166 the kept body lives in <key>_string; the map form must be gone.
            if event.get(key) is not None:
                failures.append(f"{aid}: {key} map not flattened: {json.dumps(event.get(key))[:120]}")
            want = expected_string(before, key, removed)
            raw = event.get(key + "_string")
            got = None if raw is None else json.dumps(json.loads(raw), separators=(",", ":"), sort_keys=True)
            if got != want:
                failures.append(f"{aid}: {key}_string {'kept' if want is None else 'changed'}: {str(raw)[:120]}")
        for key in ("objectRef", "user", "verb", "stage", "requestReceivedTimestamp"):
            if event.get(key) != before.get(key):
                failures.append(f"{aid}: {key} changed")

    expected_count = sum(1 for _, _, marked in cases if marked)
    counted = metric(metrics, "otelcol_exporter_sent_log_records_total", exporter="debug/credential_body_removed")
    main_route = metric(metrics, "otelcol_exporter_sent_log_records_total", exporter="debug/out")
    accepted = metric(metrics, "otelcol_receiver_accepted_log_records_total", receiver="file_log/kube_audit")
    if counted != expected_count:
        failures.append(f"counter debug/credential_body_removed = {counted}, expected {expected_count}")
    warns = [l for l in logs.stderr.splitlines() if "warn" in l.lower() or "error" in l.lower()]
    print(f"events: {len(cases)}, received: {accepted}, main route sent: {main_route}, "
          f"counted as removed: {counted} (expected {expected_count})")
    print(f"collector warnings/errors: {len(warns)}")
    for w in warns:
        print("   ", w[:300])
    if failures:
        print(f"FAILED: {len(failures)} check(s)")
        for f in failures:
            print("   ", f)
        sys.exit(1)
    print(f"PASSED: {len(cases)} events; credential bodies removed, other bodies kept, metadata preserved")


if __name__ == "__main__":
    main()
