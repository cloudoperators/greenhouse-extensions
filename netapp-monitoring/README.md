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
  - **Master** — Queries Netbox for filer inventory and coordinates workers.
  - **Worker** — Runs Harvest instances for discovered filers and exposes metrics.

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
| `apps` | Map of app labels to enable discovery (for example cinder/manila/apod/cinder-manila) | No |

## Configuration

### netappsd Controller Behavior and RBAC

The `netappsd` master component acts as a controller for discovered filers.

- It monitors filer inventory from Netbox and reconciles the desired worker state.
- It scales worker Deployments up and down based on filers discovered for each configured app label.
- It patches Pod metadata to update the `filer` label, which is used to associate running workers with the discovered filer identity.

For this reason, the chart grants the `netappsd` service account these permissions in its namespace:

- `get`, `list`, `update`, `patch` on Pods
- `get`, `list`, `update`, `patch` on Deployments
- `get`, `list` on Endpoints

Without `patch` and `update`, the master cannot reconcile runtime labels or scaling decisions correctly.

The Deployment selectors and pod labels also stay app-specific on purpose. In [harvest-netappsd-master-deployment.yaml](charts/templates/harvest-netappsd-master-deployment.yaml) and [harvest-netappsd-worker-deployment.yaml](charts/templates/harvest-netappsd-worker-deployment.yaml), the shared helper labels used elsewhere in the chart are the same for every app (`cinder`, `manila`, `apod`, `cinder-manila`), so using them as the Deployment selector would make all master and worker Deployments select across each other's pods and break isolation. The `name: {{ include "netapp-monitoring.fullname" . }}-{{ $appName }}-master` label remains inline because it uniquely identifies pods per app and keeps each Deployment scoped to its own workload.

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
