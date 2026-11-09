<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# Logs chart — local collector testing

This directory provides an "all pipelines enabled" setup so the OpenTelemetry
collectors rendered by the `logs` chart can be built, inspected, and run
locally in a container without a Kubernetes cluster.

## Layout

```
tests/
  values/
    all-pipelines-openstack.yaml   # Kafka backend; logs daemonset = containerd + openstack
    all-pipelines-ceph.yaml        # Kafka backend; logs daemonset = containerd + ceph
  env/
    collector.env                  # dummy ${...} substitutions for standalone runs
  run-tests.sh                     # lint -> template -> extract -> validate harness
  renders/                         # generated output (git-ignored)
```

## Why two values files

Enabling **all** log pipelines is not possible in a single render because of two
render-time exclusivities in the chart:

1. **ceph vs openstack/containerd** — enabling `cephConfig` suppresses the
   `logs/containerd` pipeline (both the basic and the OpenStack-enriched form are
   guarded `not ceph` in `charts/templates/logs-collector.yaml`). So:
   - `all-pipelines-openstack.yaml` renders the OpenStack-enriched `logs/containerd`
   - `all-pipelines-ceph.yaml` renders `logs/ceph`

   Everything else (journald, k8s events, kvm, all external receivers, metrics,
   ingester) is identical in both files.

2. **kafka vs opensearch exporters** — the exporter graph differs entirely by
   backend. These files use the **Kafka** backend (`openTelemetry.kafka` +
   `openTelemetry.auditKafka`), which also exercises the ingester collector.

## What gets rendered

Each values file produces four `OpenTelemetryCollector` resources:

| name                | role                                              |
|---------------------|---------------------------------------------------|
| `logs`              | daemonset: journald, k8s events, containerd, kvm, ceph/openstack |
| `external`          | statefulset: alerts/deployments, syslog tcp/udp, syslog TLS, syslog HTTP, external HTTP, traces |
| `metrics`           | deployment: OTLP -> debug                         |
| `logs-ingester-logs`| deployment: Kafka -> OpenSearch ingester          |

## Running

Requires `helm`, `yq` (mikefarah yq v4), `openssl`, and a container engine
(`podman` or `docker`). The chart dependency (`opentelemetry-operator`) is
already vendored under `charts/charts/`.

```sh
# From the logs/ directory:
make test-all        # lint + template + extract + container validate (all files)
make test-render     # lint + template + extract only (no container)
make test-validate   # alias for test-all

# Or call the harness directly:
tests/run-tests.sh                 # all values files
tests/run-tests.sh openstack       # only files whose name matches *openstack*
CONTAINER_ENGINE=docker tests/run-tests.sh
SKIP_VALIDATE=1 tests/run-tests.sh # skip the container step
```

The harness:

1. `helm lint` each values file,
2. `helm template` it into `tests/renders/<file>.yaml`,
3. extracts every collector's `spec.config` into `tests/renders/<file>/<name>.yaml`
   via `yq`,
4. runs `otelcol validate --config` on each extracted config inside a container.

`validate` builds the pipelines, so TLS-enabled receivers load cert files from
disk. The harness generates a dummy self-signed cert/key/CA in
`tests/renders/certs/` and mounts it at the paths the chart references
(`/etc/ssl/syslog-tls`, `/etc/ssl/kafka`, `/etc/ssl/audit-kafka`,
`/etc/ssl/opensearch`). Credentials are supplied via `env/collector.env`.

## Running a single collector by hand

```sh
# Render + extract (e.g. the external collector of the openstack flavor):
helm template logs ./charts -f tests/values/all-pipelines-openstack.yaml \
  > tests/renders/all-pipelines-openstack.yaml
yq -e 'select(.kind == "OpenTelemetryCollector" and .metadata.name == "external") | .spec.config' \
  tests/renders/all-pipelines-openstack.yaml > tests/renders/external.yaml

# Run it locally (ports/certs/env as needed):
podman run --rm \
  --env-file tests/env/collector.env \
  -v "$(pwd)/tests/renders/certs":/etc/ssl/syslog-tls:ro,Z \
  -v "$(pwd)/tests/renders/external.yaml":/etc/otel-config.yaml:ro,Z \
  ghcr.io/cloudoperators/opentelemetry-collector-contrib:main \
  --config=/etc/otel-config.yaml \
  --feature-gates=transform.flatten.logs
```

> The `logs` and `external` collectors use transforms with `flatten_data: true`,
> which require the `transform.flatten.logs` feature gate. In-cluster the
> operator supplies it from the CR's `spec.args.feature-gates`; for a standalone
> run you must pass `--feature-gates=transform.flatten.logs` yourself.

> The values in `env/collector.env` and the generated certs are placeholders for
> local testing only — not real secrets.
