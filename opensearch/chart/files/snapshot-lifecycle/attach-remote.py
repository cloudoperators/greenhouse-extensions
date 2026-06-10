#!/usr/bin/env python3
"""Attach remote-{stream}-ism policy to converted remote searchable indexes.

ISM `ism_template` matching does not fire for indexes created by restore-like
actions, including `convert_index_to_remote` (tracked upstream in
opensearch-project/index-management#1389). The action restores indexes as
`remote_{stream}_*` (the chart's default `rename_pattern`), so this script
lists those and attaches the matching `remote-{stream}-ism` policy.

Required env:
  CLUSTER_HOST    OpenSearch base URL
  ADMIN_USER      admin username
  ADMIN_PASSWORD  admin password
  STREAMS         space-separated stream names
"""
import os
import sys
from urllib import parse

from _lib import CLUSTER, http, log

STREAMS = os.environ["STREAMS"].split()


def attach_stream(stream: str) -> int:
    """Attach the remote-{stream}-ism policy to remote indexes. Returns the
    number of per-index failures so the caller can exit nonzero and let the
    CronJob retry."""
    policy_id = f"remote-{stream}-ism"
    pattern = f"remote_{stream}_*"

    r = http("GET", f"/_plugins/_ism/policies/{policy_id}")
    if r.status == 404:
        log("warn", "policy missing, skipping", stream=stream, policy=policy_id)
        return 0
    if not r.ok:
        log("error", "policy lookup failed", stream=stream, status=r.status, body=r.text)
        sys.exit(1)

    r = http("GET", f"/{parse.quote(pattern, safe='')}?expand_wildcards=all&allow_no_indices=true&ignore_unavailable=true")
    if r.status == 404:
        log("info", "no remote indexes", stream=stream)
        return 0
    if not r.ok:
        log("error", "list indexes failed", stream=stream, status=r.status, body=r.text)
        sys.exit(1)
    indexes = list(r.json().keys())
    if not indexes:
        log("info", "no remote indexes", stream=stream)
        return 0

    attached = skipped = failed = 0
    for idx in indexes:
        explain = http("GET", f"/_plugins/_ism/explain/{parse.quote(idx, safe='')}")
        if not explain.ok:
            log("error", "explain failed", index=idx, status=explain.status, body=explain.text)
            failed += 1
            continue
        info = explain.json().get(idx) or {}
        if info.get("policy_id"):
            skipped += 1
            continue
        r = http("POST", f"/_plugins/_ism/add/{parse.quote(idx, safe='')}", {"policy_id": policy_id})
        if r.ok:
            log("info", "attached", index=idx, policy=policy_id)
            attached += 1
        else:
            log("error", "attach failed", index=idx, status=r.status, body=r.text)
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
