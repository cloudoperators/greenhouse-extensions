# Audit-logs kube-audit credential filter test

`test_kube_audit.py` runs the chart's `transform/kube_audit` credential filter in the
real collector image and checks that credential request/response bodies are removed
from kube-apiserver audit events while ordinary bodies and audit metadata are kept.

## Run it

Render the collector manifest and pass it to the test:

```sh
helm dependency build .
helm template audit-logs . \
    -f ci/test-values.yaml \
    --api-versions monitoring.coreos.com/v1 \
    --set 'auditLogs.logsCollector.selflogging.include={/var/log/pods/*/*/*.log}' \
  | yq -o=json 'select(.kind == "OpenTelemetryCollector")' > /tmp/otelcol.json

python3 ci/test_kube_audit.py /tmp/otelcol.json /tmp/kube-audit-work
```

Requires Docker, Helm and yq v4. The collector image is read from the rendered
manifest's `.spec.image`, so the test always runs against the image the chart ships;
no image is hardcoded. The container runs with `--cap-drop ALL`, no network beyond a
localhost metrics port, and mounts only a temporary work directory read-only.

## What it checks

The test feeds 33 synthetic audit events (the 27 of
[sapcc/helm-charts#13008](https://github.com/sapcc/helm-charts/pull/13008)'s shipper
suite plus runtime extras) through `file_log/kube_audit` →
`transform/kube_audit` → `routing/credential_body_removed`, and asserts for each:

- **No credential appears** in the collector output.
- **Credential bodies are removed and marked** `sap.cc.audit.credential_body_removed`:
  for Secrets, InternalSecrets and BMCSecrets the response and the request (except a
  delete's `DeleteOptions`); for TokenReviews both bodies; for the `token`,
  `adminkubeconfig` and `viewerkubeconfig` subresources the response.
- **No-credential bodies are kept** (unmarked): a delete's `DeleteOptions`, and the
  request of a token or kubeconfig request.
- **`patch.webhook.admission.k8s.io/*` and `mutation.webhook.admission.k8s.io/*`
  annotations are removed**, without setting the marker on ordinary objects.
- **Kept bodies are flattened** to `requestObject_string` / `responseObject_string`
  with `.data` removed, matching the chart's post-processing since
  [#2166](https://github.com/cloudoperators/greenhouse-extensions/pull/2166).
- **The credential-removal counter** behind the `KubeAuditCredentialBodyRemoved` alert
  (`otelcol_exporter_sent_log_records_total{exporter="debug/credential_body_removed"}`)
  equals the number of marked events.
- **The collector logs no warning or error.** An OTTL statement that fails on some
  body is only logged (`failed to execute statement`) and the event still passes, so
  the event checks alone miss it. For example, without the `IsMap` guard the
  `delete_key(..., "data")` statements fail on a JSON-patch array body
  (`unable to resolve an integer index in slice`), which the `rbac-json-patch`
  fixture triggers.

It exits non-zero and lists the failures if any check fails.
