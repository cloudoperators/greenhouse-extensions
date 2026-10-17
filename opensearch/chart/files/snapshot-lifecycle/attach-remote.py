#!/usr/bin/env python3
"""Attach remote-{stream}-ism policy to converted remote searchable indexes.

`convert_index_to_remote` restores the remote index with the original index's
creation date. ISM templates only match indexes created after the template's
last_updated_time, so every index created before the last change of the
remote-{stream}-ism policy ends up unmanaged after conversion and is never
deleted. This script attaches the policy to those indexes; indexes that
already have a policy are left untouched.

Required env:
  CLUSTER_HOST     OpenSearch base URL
  USERNAME         basic auth username
  PASSWORD         basic auth password
  STREAMS          space-separated stream names
  REMOTE_PATTERNS  space-separated `<stream>=<glob>` entries, one per stream
"""
import os
import sys
from urllib import parse

from _lib import CLUSTER, http, log

STREAMS = os.environ["STREAMS"].split()
REMOTE_PATTERNS = dict(
    entry.split("=", 1) for entry in os.environ["REMOTE_PATTERNS"].split() if "=" in entry
)


def attach_stream(stream: str) -> int:
    """Attach the remote-{stream}-ism policy to unmanaged remote indexes.
    Returns the number of failures so the caller can exit nonzero and let the
    CronJob retry."""
    policy_id = f"remote-{stream}-ism"
    pattern = REMOTE_PATTERNS.get(stream)
    if not pattern:
        log("error", "no remote pattern configured", stream=stream)
        return 1

    r = http("GET", f"/_plugins/_ism/policies/{policy_id}")
    if r.status == 404:
        log("warn", "policy missing, skipping", stream=stream, policy=policy_id)
        return 0
    if not r.ok:
        log("error", "policy lookup failed", stream=stream, status=r.status, body=r.text)
        return 1

    # explain returns 400 when the pattern matches nothing, so list first.
    quoted = parse.quote(pattern, safe="*")
    r = http("GET", f"/{quoted}?filter_path=*.settings.index.provided_name")
    if not r.ok:
        log("error", "list indexes failed", stream=stream, status=r.status, body=r.text)
        return 1
    if not r.json():
        log("info", "no remote indexes", stream=stream)
        return 0

    r = http("GET", f"/_plugins/_ism/explain/{quoted}")
    if not r.ok:
        log("error", "explain failed", stream=stream, status=r.status, body=r.text)
        return 1
    indexes = {k: v for k, v in r.json().items() if isinstance(v, dict)}

    attached = failed = 0
    for idx, info in sorted(indexes.items()):
        if info.get("index.plugins.index_state_management.policy_id") or info.get("policy_id"):
            continue
        r = http("POST", f"/_plugins/_ism/add/{parse.quote(idx, safe='')}", {"policy_id": policy_id})
        if r.ok and not r.json().get("failures"):
            log("info", "attached", index=idx, policy=policy_id)
            attached += 1
        else:
            log("error", "attach failed", index=idx, status=r.status, body=r.text)
            failed += 1

    log("info", "stream done", stream=stream, attached=attached, failed=failed,
        skipped=len(indexes) - attached - failed, total=len(indexes))
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
