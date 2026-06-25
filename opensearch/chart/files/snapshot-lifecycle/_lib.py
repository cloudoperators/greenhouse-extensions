"""Shared HTTP / TLS / logging helpers for snapshot-lifecycle scripts.

Mounted alongside install.py and attach-remote.py from the chart's ConfigMap.
Uses the Python standard library to avoid external packages.

Required env (read on import):
  CLUSTER_HOST  OpenSearch base URL
  USERNAME      basic auth username
  PASSWORD      basic auth password

Optional env:
  TLS_SKIP_VERIFY  "true" disables certificate verification
  CA_BUNDLE        path to a CA bundle used for verification
  DEBUG            "true" logs full URL, request body, and response body
"""
import base64
import json
import os
import ssl
import time
from urllib import error, request

CLUSTER = os.environ["CLUSTER_HOST"].rstrip("/")
_USERNAME = os.environ["USERNAME"]
_PASSWORD = os.environ["PASSWORD"]

_SKIP_VERIFY = os.environ.get("TLS_SKIP_VERIFY", "").lower() in ("1", "true", "yes")
_CA_BUNDLE = os.environ.get("CA_BUNDLE") or None
_DEBUG = os.environ.get("DEBUG", "").lower() in ("1", "true", "yes")

if _SKIP_VERIFY:
    SSL_CTX = ssl.create_default_context()
    SSL_CTX.check_hostname = False
    SSL_CTX.verify_mode = ssl.CERT_NONE
elif _CA_BUNDLE:
    SSL_CTX = ssl.create_default_context(cafile=_CA_BUNDLE)
else:
    SSL_CTX = ssl.create_default_context()

_AUTH_HEADER = "Basic " + base64.b64encode(
    f"{_USERNAME}:{_PASSWORD}".encode()
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
    """Issue an authenticated HTTP request against $CLUSTER_HOST."""
    url = f"{CLUSTER}{path}"
    data = json.dumps(body).encode() if body is not None else None
    if _DEBUG:
        log("debug", "http request", method=method, url=url, body=json.dumps(body, indent=2) if body is not None else "null")
    req = request.Request(url, data=data, method=method)
    req.add_header("Authorization", _AUTH_HEADER)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            r = Response(resp.status, resp.read())
    except error.HTTPError as e:
        r = Response(e.code, e.read())
    except (error.URLError, TimeoutError, ConnectionError, ssl.SSLError) as e:
        # DNS, connection refused, TLS handshake errors. Surface as a
        # synthetic Response so callers handle it like any other failure.
        r = Response(0, str(e).encode())
    if _DEBUG:
        try:
            resp_body = json.dumps(r.json(), indent=2)
        except Exception:
            resp_body = r.text
        log("debug", "http response", method=method, url=url, status=r.status, body=resp_body)
    return r
