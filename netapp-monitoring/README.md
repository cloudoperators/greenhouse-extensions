---
title: NetApp Monitoring
---

Learn more about the **netapp-monitoring** plugin. Use it to deploy [Harvest](https://github.com/NetApp/harvest) for monitoring NetApp storage filers via Prometheus metrics.

## Overview

This plugin deploys a monitoring stack for NetApp storage systems using [NetApp Harvest](https://github.com/NetApp/harvest). Harvest collects performance, capacity, and health metrics from ONTAP systems and exposes them via a Prometheus exporter.

The chart includes a service discovery component ([netappsd](https://github.com/sapcc/netappsd/tree/dme-strg)) that automatically discovers NetApp filers from Netbox and spawns Harvest instances to collect metrics.

## Architecture

Components included in this plugin:

- **Harvest** — Collects metrics from NetApp ONTAP systems using REST/ZAPI collectors and exports them in Prometheus format.
- **NetApp SD (Service Discovery)** — Discovers filers from Netbox and manages Harvest worker instances dynamically.
  - **Master** — One Deployment per configured app (`--tag`). It queries Netbox for the filer inventory and reconciles one worker Deployment per discovered filer, rendering each from a deployment template mounted from a ConfigMap.
  - **Worker** — Runs as a sidecar next to the Harvest poller. It learns its own filer name from the master (via `--filer-name`), fetches that filer's details from the master's `/filer/{name}` endpoint, and renders the Harvest exporter config.

### Reconciliation model

The master reconciles worker Deployments as filers come and go:

1. It discovers filers from Netbox and probes each of them every 5 minutes.
2. For every active, reachable filer, it **creates** a worker Deployment named after the filer — only if one does not already exist.
3. When a filer goes inactive or disappears from Netbox, it **deletes** that filer's Deployment.

Worker Deployments the master creates are labeled `app.kubernetes.io/managed-by=netappsd` and carry a `netappsd/filer=<name>` label identifying their filer. These Deployments are **not** tracked by Helm — they are created at runtime — which has two consequences the chart handles explicitly:

- **Uninstall cleanup.** A `pre-delete` hook Job ([harvest-netappsd-cleanup-hook.yaml](charts/templates/harvest-netappsd-cleanup-hook.yaml)) deletes all `managed-by=netappsd` Deployments before the release is removed, so the master-created workers are not orphaned on `helm uninstall`. The hook image is configured via `netappsd.cleanup.image.repository` and `netappsd.cleanup.image.tag`.
- **Template changes do not auto-propagate.** Because reconciliation is create-if-missing, editing the worker template ([files/deployment.yaml.tpl](charts/files/deployment.yaml.tpl)) does **not** update already-running worker Deployments — the master only applies the new template to workers it creates afterward (as filers churn). To roll existing workers onto a new template, delete the managed worker Deployments (`kubectl delete deploy -l app.kubernetes.io/managed-by=netappsd -n <namespace>`); the master recreates them from the current template within its next reconcile (~5 min).

## Quick Start

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster.
- NetApp ONTAP filer credentials.
- Netbox API access with a valid token.

**Step 1:**

Install the `netapp-monitoring` plugin via the Greenhouse dashboard or by creating a `Plugin` resource in your Greenhouse central cluster.

**Step 2:**

Configure the required options:

| Parameter | Description | Required |
|-----------|-------------|----------|
| `harvest.image.repository` | Harvest container image repository | Yes |
| `harvest.image.tag` | Harvest container image tag | Yes |
| `netappsd.enabled` | Enable NetApp service discovery | Yes |
| `netappsd.image.repository` | NetApp SD container image repository | Yes |
| `netappsd.image.tag` | NetApp SD container image tag | Yes |
| `netappsd.region` | Region for service discovery | Yes |
| `netappsd.lob` | Line of business label applied to discovered filer metrics | Yes |
| `netappsd.credentials_file` | Mount path for the Harvest credentials file inside the poller container | Yes |
| `netappsd.credentials_secret` | Name of the generated credentials secret (for example `local-basic-auth`) | Yes |
| `netappsd.netapp_exporter_user` | NetApp exporter username | Yes |
| `netappsd.netapp_exporter_password` | NetApp exporter password | Yes |
| `netappsd.netbox_api_token` | Netbox API token | Yes |
| `netappsd.netbox_host` | Netbox host URL | Yes |
| `netappsd.cleanup.image.repository` | kubectl image repository for the pre-delete cleanup hook | No |
| `netappsd.cleanup.image.tag` | kubectl image tag for the pre-delete cleanup hook | No |
| `apps` | Map of app labels to enable discovery (for example cinder/manila/apod/cinder-manila) | No |
| `additionalLabels` | Extra labels merged onto every resource the chart renders (for example `ccloud/service`, `ccloud/support-group`) | No |
| `extraManifests` | List of additional Kubernetes manifests to render alongside the chart (for example owner-info metadata) | No |

## Configuration

### netappsd Controller Behavior and RBAC

The `netappsd` master component acts as a controller for discovered filers.

- It monitors filer inventory from Netbox and reconciles the desired worker state.
- It creates and deletes worker Deployments per filer, rendered from the `deployment.yaml.tpl` template. The template is delivered per app through a per-app `deployment-template` ConfigMap ([harvest-netappsd-deployment-template-configmap.yaml](charts/templates/harvest-netappsd-deployment-template-configmap.yaml)), mounted into the master at `/etc/netappsd` and passed via the `--deployment-template` flag.
- It patches Pod metadata to update the `filer` label, which is used to associate running workers with the discovered filer identity.

For this reason, the chart grants the `netappsd` service account these permissions in its namespace:

- `get`, `list`, `update`, `patch` on Pods
- `get`, `list`, `update`, `patch`, `create`, `delete` on Deployments
- `get`, `list` on Endpoints

Without `create`/`delete` the master cannot reconcile worker Deployments, and without `patch`/`update` it cannot maintain runtime pod labels. The `delete` verb is also what lets the pre-delete cleanup hook remove managed workers on uninstall.

The master Deployment selectors and pod labels stay app-specific on purpose. In [harvest-netappsd-master-deployment.yaml](charts/templates/harvest-netappsd-master-deployment.yaml), the shared helper labels used elsewhere in the chart are the same for every app (`cinder`, `manila`, `apod`, `cinder-manila`), so using them as the Deployment selector would make all master Deployments select across each other's pods and break isolation. The `name: {{ include "netapp-monitoring.fullname" . }}-{{ $appName }}-master` label remains inline because it uniquely identifies pods per app and keeps each Deployment scoped to its own workload.

Worker pods created from the template carry two labels: a stable per-app `app: <fullname>-<app>-worker` label (set at chart install time) that the per-app worker Service selects on, and a `name: <filer>` label (filled by the master at runtime) that uniquely identifies each filer's pod. Keeping scraping keyed off the stable `app` label means the Service continues to select every filer's worker pod regardless of which filers are currently discovered.

### Harvest

The Harvest component is configured with the following default collectors:

- `Ems` — Event Management System
- `Rest` — REST API metrics
- `RestPerf` — REST performance counters
- `KeyPerf` — Key performance metrics
- `Unix` — Unix host metrics
- `Simple` — Simple counter metrics

Metrics are exposed on port `13000` via the Prometheus exporter.

### Service Discovery Apps

The `apps` section configures which filers are discovered based on their Netbox labels:

```yaml
apps:
  cinder:
    enabled: true
  manila:
    enabled: true
  apod:
    enabled: true
  cinder-manila:
    enabled: true
```

### Additional Labels

`additionalLabels` are applied in two places:

- On the `metadata.labels` of every resource the chart renders (master Deployments, Services, ConfigMaps, the cleanup hook, and the runtime worker Deployment template), via the common label set.
- On the **pod template** labels of the master and worker Deployments, so the running master and master-created worker pods carry them too.

Values are quoted when rendered, so non-string scalars are emitted as valid label strings. Note that YAML parses unquoted numbers/bools before templating (e.g. `1.0` becomes `1`); quote such values in your config to preserve them exactly.

```yaml
additionalLabels:
  ccloud/service: netapp-monitoring
  ccloud/support-group: storage
```

### Extra Manifests

`extraManifests` renders arbitrary Kubernetes objects alongside the chart. Each list entry is a full manifest and is passed through Helm templating, so entries may reference chart values.

### Example Plugin Resource

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: netapp-monitoring
spec:
  pluginDefinition: netapp-monitoring
  clusterName: my-cluster
  optionValues:
    - name: harvest.image.repository
      value: keppel.eu-de-1.cloud.sap/ccloud/harvest
    - name: harvest.image.tag
      value: "25.11.0-20251126205434"
    - name: netappsd.enabled
      value: true
    - name: netappsd.image.repository
      value: keppel.eu-de-1.cloud.sap/ccloud/netappsd
    - name: netappsd.image.tag
      value: dme-strg-20260617091551
    - name: netappsd.region
      value: eu-de-1
    - name: netappsd.netapp_exporter_user
      valueFrom:
        secret:
          name: netapp-monitoring-secrets
          key: exporter-user
    - name: netappsd.netapp_exporter_password
      valueFrom:
        secret:
          name: netapp-monitoring-secrets
          key: exporter-password
    - name: netappsd.netbox_api_token
      valueFrom:
        secret:
          name: netapp-monitoring-secrets
          key: netbox-token
```

## Maintainers

- Ganesh Kugulakrishnan
- Chandrakanth Renduchintala
