# netapp-monitoring-operations

A Helm chart that deploys NetApp (and related storage) Prometheus alerting rules as
`PrometheusRule` resources, plus a `PodMonitor` that scrapes the NetApp Harvest
poller pods.

## Overview

The chart renders one `PrometheusRule` per alert file under `storage-alerts/` and a
single `PodMonitor` for metric collection. Every rule group and every individual
alert can be toggled on or off through `values.yaml`, so you can tailor the alert
set to your environment without editing the rule files.

Covered components:

- **NetApp** — volume, aggregate, cluster, disk, LUN, network, NVDimm, and EMS
  alerts, plus a large set of EMS-derived event alerts (`netapp_test_alerts.yaml`).
- **Brocade** — switch error alerts. *(forge project — disabled by default)*
- **PowerScale** — error alerts. *(forge project — disabled by default)*
- **Pure Storage** — error alerts. *(forge project — disabled by default)*
- **Kubernetes** — PVC usage alerts. *(forge project — disabled by default)*
- **Harvest** — poller scrape-health alerts.

> **Scope note:** the Brocade, PowerScale, Pure Storage, and PVC usage rule groups
> belong to the **forge** project and are **not** part of the sci scope, so they are
> shipped **disabled by default**. Enable them by setting the relevant
> `prometheusRules.ruleGroups.*` keys to `true`.

## Prerequisites

- Helm 3+
- A Prometheus Operator deployment providing the `PrometheusRule` and `PodMonitor`
  CRDs (`monitoring.coreos.com/v1`).
- A Prometheus instance whose `ruleSelector` / `podMonitorSelector` matches the
  `labels` configured in `values.yaml` (default `plugin: storage-metrics-product`).

## Installation

```bash
helm install netapp-monitoring-operations ./charts
```

Resources are created in the **release namespace** (`.Release.Namespace`). Use
`-n <namespace>` to control where they land:

```bash
helm install netapp-monitoring-operations ./charts -n storage-product
```

## Resource Naming

| Resource | Name |
|---|---|
| `PrometheusRule` | `<release>-<alert-file>` (e.g. `t-netapp-volume-alerts`) |
| `PodMonitor` | `<release>-harvest-pod-monitor` |

Both resources are created in `.Release.Namespace`.

## Configuration

### PrometheusRules

| Parameter | Description | Default |
|---|---|---|
| `prometheusRules.create` | Render the `PrometheusRule` resources | `true` |
| `prometheusRules.labels` | Labels applied to every `PrometheusRule`. `plugin` must match the Prometheus `ruleSelector`. | `plugin: storage-metrics-product` |
| `prometheusRules.annotations` | Annotations applied to every `PrometheusRule`. Falls back to `prometheus.io/alert: "true"` when unset. | `{}` |
| `prometheusRules.ruleGroups` | Map of `<groupKey>: true\|false` to enable/disable whole rule groups. Must be a map; set to `{}` to enable all groups. | NetApp + Harvest groups `true`; Brocade/PowerScale/PureStorage/PVC (forge) `false` |
| `prometheusRules.disabled` | Map of `<AlertName>: true` to drop individual alerts by exact name. Unlisted alerts stay enabled. | `{}` |
| `prometheusRules.commonLabels.support_group` | `support_group` label applied to every alert. | `storage` |
| `prometheusRules.commonLabels.team` | `team` label applied to every alert. | `dme-storage` |

### PodMonitor

| Parameter | Description | Default |
|---|---|---|
| `podMonitor.labels` | Labels applied to the `PodMonitor`. `plugin` must match the Prometheus `podMonitorSelector`. | `plugin: storage-metrics-product` |
| `podMonitor.targetNamespaces` | Namespace(s) where the target pods run. **Required.** | `[storage-product]` |
| `podMonitor.selectorMatchLabels` | Pod labels that uniquely select the target pods. **Required.** | `ccloud/service: netapp-monitoring` |
| `podMonitor.port` | Container port name to scrape. | `metrics` |
| `podMonitor.path` | Metrics path. | `/metrics` |
| `podMonitor.scheme` | Scrape scheme. | `http` |
| `podMonitor.scrapeInterval` | Scrape interval. | `15s` |
| `podMonitor.jobLabel` | Pod label key whose value becomes the Prometheus `job` label. | `ccloud/service` |
| `podMonitor.relabelings` | Additional target relabelings. | `[]` |
| `podMonitor.additionalMetricRelabelings` | Metric relabelings appended after the `netapp_cluster` mapping. | `[]` |

### Required values and guards

- `podMonitor.targetNamespaces` and `podMonitor.selectorMatchLabels` are
  **required** — rendering fails with a clear message if either is unset, so the
  chart never produces a `PodMonitor` that selects all pods/namespaces.
- `prometheusRules.commonLabels.support_group` / `team` are **optional** and fall
  back to `storage` / `dme-storage` when `commonLabels` is omitted.

## Enabling / disabling alerts

Disable an entire rule group by setting its key to `false`:

```yaml
prometheusRules:
  ruleGroups:
    pvcUsageAlerts: false
    netappEmsAlerts: false
```

Group keys are the camelCase form of the group `name`
(e.g. group `brocade_error_alerts` → `brocadeErrorAlerts`).

Disable a single alert by its exact alert name:

```yaml
prometheusRules:
  disabled:
    AggrOffline: true
    BrocadeError_New: true
```

If every group in a file is disabled, that file renders as `groups: []` and
produces an empty (but valid) `PrometheusRule`.

## Chart Structure

```
charts/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── pod-monitor.yaml
│   └── storage-prometheusrules.yaml
└── storage-alerts/
    ├── brocade-error-alerts.yaml
    ├── harvest-poller-alerts.yaml
    ├── netapp_aggr_alerts.yaml
    ├── netapp_cluster_alerts.yaml
    ├── netapp_disk_alerts.yaml
    ├── netapp_ems_alerts.yaml
    ├── netapp_lun_alerts.yaml
    ├── netapp_network_alerts.yaml
    ├── netapp_nvdimm_alerts.yaml
    ├── netapp_test_alerts.yaml
    ├── netapp_volume_alerts.yaml
    ├── powerscale-error-alerts.yaml
    ├── purestorage-error-alerts.yaml
    └── pvc-usage-alerts.yaml
```

## Maintainers

| Name |
|---|
| Ganesh Kugulakrishnan |
| Chandrakanth Renduchintala |