#!/usr/bin/env python3
"""Install OpenSearch snapshot lifecycle: register S3 repositories, install
ISM/SM policies. Idempotent — re-running is safe; PUT replaces wholesale.

Required env:
  CLUSTER_HOST    e.g. https://opensearch.{namespace}.svc.cluster.local:9200
  ADMIN_USER      OpenSearch admin username
  ADMIN_PASSWORD  OpenSearch admin password
  STREAMS         space-separated stream names (e.g. "audit hermes")

For each stream {name} expects four files in /scripts/:
  ds-{name}-ism.json
  remote-{name}-ism.json
  snapshot-{name}-delete-policy.json
  snapshot-repo-{name}.json
"""
import json
import os
import sys
import time
from pathlib import Path

import requests
from requests.auth import HTTPBasicAuth

CLUSTER = os.environ["CLUSTER_HOST"].rstrip("/")
AUTH = HTTPBasicAuth(os.environ["ADMIN_USER"], os.environ["ADMIN_PASSWORD"])
STREAMS = os.environ["STREAMS"].split()
SCRIPTS = Path("/scripts")

session = requests.Session()
session.auth = AUTH
session.verify = False
requests.packages.urllib3.disable_warnings()


def log(msg: str) -> None:
    print(f"[snapshot-lifecycle] {msg}", flush=True)


def wait_for_cluster(timeout_s: int = 240) -> None:
    """Block until the cluster reports green or yellow."""
    log(f"waiting for cluster_manager at {CLUSTER}")
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            r = session.get(f"{CLUSTER}/_cluster/health", timeout=5)
            status = r.json().get("status")
            if status in ("green", "yellow"):
                log(f"cluster ready (status={status})")
                return
        except Exception:
            pass
        time.sleep(2)
    sys.exit("cluster did not become ready in time")


def put(path: str, body: dict) -> None:
    """PUT a JSON body. ISM/SM policy PUTs are idempotent — replace wholesale."""
    log(f"PUT {path}")
    r = session.put(f"{CLUSTER}{path}", json=body, timeout=30)
    if not r.ok:
        log(f"  -> {r.status_code}: {r.text}")
        r.raise_for_status()


def load(filename: str, substitutions: dict | None = None) -> dict:
    """Load a JSON file, applying string substitutions before parsing."""
    raw = (SCRIPTS / filename).read_text()
    for key, value in (substitutions or {}).items():
        raw = raw.replace(key, value)
    return json.loads(raw)


def install_stream(stream: str) -> None:
    log(f"--- {stream} ---")

    # Register the S3 snapshot repository (strip 'name' from body — it lives in the URL).
    repo = load(f"snapshot-repo-{stream}.json")
    put(f"/_snapshot/{repo.pop('name')}", repo)

    # Substitute the snapshot name placeholder in the ds-* policy.
    # OpenSearch evaluates {ctx.index} at policy execution time.
    ds_policy = load(f"ds-{stream}-ism.json", {"_SNAPSHOT_NAME_": "{ctx.index}"})
    put(f"/_plugins/_ism/policies/ds-{stream}-ism", ds_policy)
    put(f"/_plugins/_ism/policies/remote-{stream}-ism", load(f"remote-{stream}-ism.json"))
    put(
        f"/_plugins/_sm/policies/snapshot-{stream}-delete-policy",
        load(f"snapshot-{stream}-delete-policy.json"),
    )


def main() -> None:
    wait_for_cluster()
    for stream in STREAMS:
        install_stream(stream)
    log("done")


if __name__ == "__main__":
    main()
