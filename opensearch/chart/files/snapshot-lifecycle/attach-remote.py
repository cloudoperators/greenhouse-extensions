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
import base64
import json
import os
import ssl
import sys
import time
from urllib import error, parse, request

CLUSTER = os.environ["CLUSTER_HOST"].rstrip("/")
ADMIN_USER = os.environ["ADMIN_USER"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
STREAMS = os.environ["STREAMS"].split()

SKIP_VERIFY = os.environ.get("TLS_SKIP_VERIFY", "").lower() in ("1", "true", "yes")
CA_BUNDLE = os.environ.get("CA_BUNDLE") or None

if SKIP_VERIFY:
    SSL_CTX = ssl.create_default_context()
    SSL_CTX.check_hostname = False
    SSL_CTX.verify_mode = ssl.CERT_NONE
elif CA_BUNDLE:
    SSL_CTX = ssl.create_default_context(cafile=CA_BUNDLE)
else:
    SSL_CTX = ssl.create_default_context()

_AUTH_HEADER = "Basic " + base64.b64encode(
    f"{ADMIN_USER}:{ADMIN_PASSWORD}".encode()
).decode()


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


class Response:
    __slots__ = ("status", "body")

    def __init__(self, status: int, body: bytes):
        self.status = status
        self.body = body

    @property
    def ok(self) -> bool:
        return 200 <= self.status < 300

    @property
    def text(self) -> str:
        return self.body.decode("utf-8", errors="replace")

    def json(self) -> dict:
        return json.loads(self.body) if self.body else {}


def http(method: str, path: str, body: dict | None = None, timeout: int = 30) -> Response:
    data = json.dumps(body).encode() if body is not None else None
    req = request.Request(f"{CLUSTER}{path}", data=data, method=method)
    req.add_header("Authorization", _AUTH_HEADER)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            return Response(resp.status, resp.read())
    except error.HTTPError as e:
        return Response(e.code, e.read())


def attach_stream(stream: str) -> int:
    """Attach the remote-{stream}-ism policy to remote indexes. Returns the
    number of per-index failures so the caller can exit nonzero and let the
    CronJob retry."""
    policy_id = f"remote-{stream}-ism"
    pattern = f"remote_.ds-{stream}-*"

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
