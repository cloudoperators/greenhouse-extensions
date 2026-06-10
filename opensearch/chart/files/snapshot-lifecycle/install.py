#!/usr/bin/env python3
"""Install OpenSearch snapshot lifecycle.

Registers snapshot repositories and installs ISM/SM policies for each stream
named in the STREAMS env var. Idempotent: PUT replaces wholesale.

Required env:
  CLUSTER_HOST    OpenSearch base URL
  ADMIN_USER      admin username
  ADMIN_PASSWORD  admin password
  REPOSITORIES    space-separated repository names
  STREAMS         space-separated stream names

For each repository {name} expects in /scripts/:
  snapshot-repo-{name}.json

For each stream {name} expects in /scripts/:
  ds-{name}-ism.json
  snapshot-{name}-delete-policy.json

The `remote-{name}-ism` policy is rendered as an OpenSearchISMPolicy CRD by
the chart (the CRD covers replicaCount + delete actions). Only the
`ds-{name}-ism` policy needs HTTP install: it uses convert_index_to_remote,
which the shipped CRD does not yet support
(opensearch-k8s-operator#1402).
"""
import base64
import json
import os
import ssl
import sys
import time
from pathlib import Path
from urllib import error, request

CLUSTER = os.environ["CLUSTER_HOST"].rstrip("/")
ADMIN_USER = os.environ["ADMIN_USER"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
STREAMS = os.environ["STREAMS"].split()
REPOSITORIES = os.environ["REPOSITORIES"].split()
SCRIPTS = Path("/scripts")

# TLS_SKIP_VERIFY=true disables certificate verification (default: verify).
# CA_BUNDLE points at a mounted CA bundle file when verifying against a
# private CA. The chart mounts the cluster's HTTP TLS secret by default.
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
    """Emit a logfmt line: ts=... level=... msg="..." key=value ..."""
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


def wait_for_cluster(timeout_s: int = 240) -> None:
    """Block until the cluster reports green or yellow."""
    log("info", "waiting for cluster", host=CLUSTER, timeout_s=timeout_s)
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            r = http("GET", "/_cluster/health", timeout=5)
            if r.ok:
                status = r.json().get("status")
                if status in ("green", "yellow"):
                    log("info", "cluster ready", status=status)
                    return
        except Exception:
            pass
        time.sleep(2)
    log("error", "cluster not ready in time", timeout_s=timeout_s)
    sys.exit(1)


def put(path: str, body: dict) -> None:
    log("info", "creating resource", method="PUT", path=path)
    r = http("PUT", path, body)
    if not r.ok:
        log("error", "request failed", method="PUT", path=path, status=r.status, body=r.text)
        sys.exit(1)


def put_policy(path: str, body: dict) -> None:
    """PUT an ISM policy with optimistic concurrency.

    First install is a plain PUT. Updates need the current document's seq_no
    and primary_term passed back in the URL or OpenSearch returns 409.
    """
    r = http("GET", path)
    if r.status == 404:
        return put(path, body)
    if not r.ok:
        log("error", "request failed", method="GET", path=path, status=r.status, body=r.text)
        sys.exit(1)

    existing = r.json()
    seq_no = existing.get("_seq_no")
    primary_term = existing.get("_primary_term")
    qs = f"?if_seq_no={seq_no}&if_primary_term={primary_term}"
    log("info", "updating resource", method="PUT", path=path, seq_no=seq_no, primary_term=primary_term)
    r = http("PUT", f"{path}{qs}", body)
    if not r.ok:
        log("error", "request failed", method="PUT", path=path, status=r.status, body=r.text)
        sys.exit(1)


def put_sm_policy(path: str, body: dict) -> None:
    """Upsert a Snapshot Management policy.

    SM policies require POST to create and PUT (with seq_no/primary_term) to
    update. The endpoint rejects PUT-as-create and PUT-without-concurrency-
    tokens-when-the-doc-exists, so we explicitly check existence first.
    """
    r = http("GET", path)
    if r.status == 404:
        log("info", "creating resource", method="POST", path=path)
        r = http("POST", path, body)
        if not r.ok:
            log("error", "request failed", method="POST", path=path, status=r.status, body=r.text)
            sys.exit(1)
        return
    if not r.ok:
        log("error", "request failed", method="GET", path=path, status=r.status, body=r.text)
        sys.exit(1)

    existing = r.json()
    seq_no = existing.get("_seq_no")
    primary_term = existing.get("_primary_term")
    qs = f"?if_seq_no={seq_no}&if_primary_term={primary_term}"
    log("info", "updating resource", method="PUT", path=path, seq_no=seq_no, primary_term=primary_term)
    r = http("PUT", f"{path}{qs}", body)
    if not r.ok:
        log("error", "request failed", method="PUT", path=path, status=r.status, body=r.text)
        sys.exit(1)


def load(filename: str, substitutions: dict | None = None) -> dict:
    """Load a JSON file, applying string substitutions before parsing."""
    raw = (SCRIPTS / filename).read_text()
    for key, value in (substitutions or {}).items():
        raw = raw.replace(key, value)
    return json.loads(raw)


def install_repository(name: str) -> None:
    """Register a snapshot repository (or update its settings if it exists)."""
    repo = load(f"snapshot-repo-{name}.json")
    put(f"/_snapshot/{repo.pop('name')}", repo)


def install_stream(stream: str) -> None:
    log("info", "installing stream", stream=stream)

    # {ctx.index} is evaluated by OpenSearch at policy execution; pre-substitute
    # the placeholder we use in the rendered template.
    ds_policy = load(f"ds-{stream}-ism.json", {"_SNAPSHOT_NAME_": "{ctx.index}"})
    put_policy(f"/_plugins/_ism/policies/ds-{stream}-ism", ds_policy)
    put_sm_policy(
        f"/_plugins/_sm/policies/snapshot-{stream}-delete-policy",
        load(f"snapshot-{stream}-delete-policy.json"),
    )


def main() -> None:
    wait_for_cluster()
    for repo in REPOSITORIES:
        install_repository(repo)
    for stream in STREAMS:
        install_stream(stream)
    log("info", "done", streams=" ".join(STREAMS), repositories=" ".join(REPOSITORIES))


if __name__ == "__main__":
    main()
