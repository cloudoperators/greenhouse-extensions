#!/usr/bin/env python3
"""Attach remote-{stream}-ism policy to converted remote searchable indexes.

ISM ism_template auto-applies on index creation. The convert_index_to_remote
action creates `remote_.ds-{stream}-*` indexes, but template matching is not
reliably applied at that moment. This script lists those indexes and attaches
the remote-{stream}-ism policy to any that have no policy yet.

Required env:
  CLUSTER_HOST    OpenSearch base URL
  ADMIN_USER      admin username
  ADMIN_PASSWORD  admin password
  STREAMS         space-separated stream names
"""
import os
import sys
import time
from urllib.parse import quote

import requests
from requests.auth import HTTPBasicAuth

CLUSTER = os.environ["CLUSTER_HOST"].rstrip("/")
AUTH = HTTPBasicAuth(os.environ["ADMIN_USER"], os.environ["ADMIN_PASSWORD"])
STREAMS = os.environ["STREAMS"].split()

SKIP_VERIFY = os.environ.get("TLS_SKIP_VERIFY", "").lower() in ("1", "true", "yes")
CA_BUNDLE = os.environ.get("CA_BUNDLE") or None

session = requests.Session()
session.auth = AUTH
if SKIP_VERIFY:
    session.verify = False
    requests.packages.urllib3.disable_warnings()
elif CA_BUNDLE:
    session.verify = CA_BUNDLE


def log(level: str, msg: str, **fields) -> None:
    parts = [
        f"ts={time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
        f"level={level}",
        f'msg="{msg}"',
    ]
    for k, v in fields.items():
        s = str(v)
        if any(c in s for c in ' "\\='):
            s = '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'
        parts.append(f"{k}={s}")
    print(" ".join(parts), flush=True)


def get(path: str) -> requests.Response:
    return session.get(f"{CLUSTER}{path}", timeout=30)


def post(path: str, body: dict) -> requests.Response:
    return session.post(f"{CLUSTER}{path}", json=body, timeout=30)


def attach_stream(stream: str) -> int:
    """Attach the remote-{stream}-ism policy to remote indexes. Returns the
    number of per-index failures so the caller can exit nonzero and let the
    CronJob retry."""
    policy_id = f"remote-{stream}-ism"
    pattern = f"remote_.ds-{stream}-*"

    r = get(f"/_plugins/_ism/policies/{policy_id}")
    if r.status_code == 404:
        log("warn", "policy missing, skipping", stream=stream, policy=policy_id)
        return 0
    if not r.ok:
        log("error", "policy lookup failed", stream=stream, status=r.status_code, body=r.text)
        r.raise_for_status()

    r = get(f"/{quote(pattern, safe='')}?expand_wildcards=all&allow_no_indices=true&ignore_unavailable=true")
    if r.status_code == 404:
        log("info", "no remote indexes", stream=stream)
        return 0
    if not r.ok:
        log("error", "list indexes failed", stream=stream, status=r.status_code, body=r.text)
        r.raise_for_status()
    indexes = list(r.json().keys())
    if not indexes:
        log("info", "no remote indexes", stream=stream)
        return 0

    attached = skipped = failed = 0
    for idx in indexes:
        explain = get(f"/_plugins/_ism/explain/{quote(idx, safe='')}")
        if not explain.ok:
            log("error", "explain failed", index=idx, status=explain.status_code, body=explain.text)
            failed += 1
            continue
        info = explain.json().get(idx) or {}
        if info.get("policy_id"):
            skipped += 1
            continue
        r = post(f"/_plugins/_ism/add/{quote(idx, safe='')}", {"policy_id": policy_id})
        if r.ok:
            log("info", "attached", index=idx, policy=policy_id)
            attached += 1
        else:
            log("error", "attach failed", index=idx, status=r.status_code, body=r.text)
            failed += 1

    log("info", "stream done", stream=stream, attached=attached, skipped=skipped, failed=failed, total=len(indexes))
    return failed


def main() -> None:
    log("info", "starting", host=CLUSTER, streams=" ".join(STREAMS))
    failures = 0
    for stream in STREAMS:
        failures += attach_stream(stream)
    log("info", "done", failures=failures)
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
