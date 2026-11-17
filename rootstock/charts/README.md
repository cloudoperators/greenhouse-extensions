<!--
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# rootstock Helm chart

Helm chart for [rootstock](https://github.com/cloudoperators/rootstock), a
data-center energy/power telemetry collector that scrapes Redfish targets and
exposes Prometheus metrics via a multi-target probe pattern. Compatible with
[Greenhouse](https://github.com/cloudoperators/greenhouse) plugins (see
`k8s_configuration/plugindefinition.yaml`).

## Install

```bash
# Inline credentials (chart renders the Secret) — for local / self-contained runs:
helm install rootstock k8s_configuration/chart \
  --set 'redfish.access.pdu1.username=redfish' \
  --set 'redfish.access.pdu1.password=s3cr3t'

# Pre-created Secret (recommended for production):
helm install rootstock k8s_configuration/chart \
  --set rootstock.redfish.existingSecret=rootstock-redfish
```

### Local testing on kind

From the repository root the Makefile wires up a full local environment (build +
load image, deploy a DMTF Redfish mockup, create the Secret, install the chart):

```bash
make kind-up        # create cluster + deploy
make kind-validate  # port-forward and probe the pod
make kind-delete    # tear down
```

`helm test rootstock -n rootstock` runs an in-cluster smoke test against
`/healthz` and `/ready`.

## Redfish credentials

rootstock reads per-PDU credentials from a read-only mounted file at
`<rootstock.config.folder>/redfish_pdus.yaml`, watched (fsnotify) and
hot-reloaded on change. Credentials are never passed as environment variables.

Provide them one of two ways:

| Mode            | Value                                      | Use case                                        |
| --------------- | ------------------------------------------ | ----------------------------------------------- |
| Existing Secret | `rootstock.redfish.existingSecret: <name>` | Production; Secret managed externally.          |
| Inline          | `redfish.access: {pdu1: {...}}`            | Local / self-contained; chart renders a Secret. |

Either way the Secret must hold a `redfish_pdus.yaml` key in this format:

```yaml
pdu1:
  username: redfish
  password: changeThis
```

For Greenhouse, prefer `rootstock.redfish.existingSecret` (pre-create the Secret
in the namespace), or set `redfish.access` via `optionValues` if the Plugin
operator supports map values.

## Values

See [`values.yaml`](./values.yaml) for the full list. Key options:

| Key                                | Default                            | Description                                    |
| ---------------------------------- | ---------------------------------- | ---------------------------------------------- |
| `image.repository`                 | `ghcr.io/cloudoperators/rootstock` | Image repository.                              |
| `image.tag`                        | `""` (chart version)               | Image tag.                                     |
| `rootstock.redfish.existingSecret` | `""`                               | Pre-created Secret holding credentials.        |
| `redfish.access`                   | `{pdu1: {username, password}}`     | Inline per-PDU credentials (renders a Secret). |
| `rootstock.config.folder`          | `/config`                          | Mount dir for config and credentials.          |
| `rootstock.port`                   | `9220`                             | Container port.                                |
| `rootstock.log.level`              | `debug`                            | Log level (`debug`, `info`, `warn`, `error`).  |
| `rootstock.scrape.timeout`         | `30s`                              | Upstream Redfish scrape timeout.               |
| `service.type` / `service.port`    | `ClusterIP` / `9220`               | Service exposure.                              |
| `serviceMonitor.enabled`           | `false`                            | Create a Prometheus Operator ServiceMonitor.   |
| `snmpExporter.enabled`             | `false`                            | Deploy the SNMP exporter sidecar.              |

## Endpoints

rootstock serves `/healthz`, `/ready`, `/metrics`, and the multi-target
`/probe?target=<redfish-url>&labels=<pdu_id>` on `rootstock.port` (default
9220).

## SNMP exporter sidecar (optional)

When `snmpExporter.enabled=true`, a Prometheus SNMP exporter runs as a sidecar
on port `9116`, serving `/snmp?target=<device>&module=<module>`. It is **not**
exposed via the Service — reach it via pod IP or `kubectl port-forward`:

```bash
kubectl port-forward -n rootstock deployment/rootstock 9116:9116
curl "http://localhost:9116/snmp?target=192.168.1.1&module=if_mib"
```

Configure it inline under `snmpExporter.config` (an `snmp.yml` with a `modules`
wrapper), or point `snmpExporter.configFile` at a file in the chart directory
(see `files/snmp.yml` and `files/README.md`).
