---
title: Perses
---

## Table of Contents
- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Disclaimer](#disclaimer)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Create a custom dashboard](#create-a-custom-dashboard)
- [Add Dashboards as ConfigMaps](#add-dashboards-as-configmaps)
    - [Recommended folder structure for dashboards](#recommended-folder-structure-for-dashboards)

> [!WARNING]
> This plugin is in beta and please report any bugs by creating an issue in this [GitHub repository](https://github.com/cloudoperators/greenhouse-extensions/issues/new/choose).

Learn more about the **Perses** Plugin. Use it to visualize Prometheus/Thanos metrics for your Greenhouse remote cluster.


The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview 

Observability is often required for the operation and automation of service offerings. [Perses](https://perses.dev/) is a CNCF project and it aims to become an open-standard for dashboards and visualization. It provides you with tools to display Prometheus metrics on live dashboards with insightful charts and visualizations. In the Greenhouse context, this complements the **kube-monitoring** plugin, which automatically acts as a Perses data source which is recognized by Perses. In addition, the Plugin provides a mechanism that automates the lifecycle of datasources and dashboards without having to restart Perses.

![Perses Architecture](img/perses-arch.png)

## Disclaimer

This is not meant to be a comprehensive package that covers all scenarios. If you are an expert, feel free to configure the Plugin according to your needs.

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick Start

This guide provides a quick and straightforward way how to use Perses as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running and Greenhouse-managed Kubernetes remote cluster
- `kube-monitoring` Plugin should be installed with `.spec.kubeMonitoring.prometheus.persesDatasource: true` and it should have at least one Prometheus instance running in the cluster

The plugin works by default with anonymous access enabled. This plugin comes with some default dashboards and the kube-monitoring datasource will be automatically discovered by the plugin.

**Step 1: Add your dashboards and datasources**

Dashboards are selected from `ConfigMaps` across namespaces. The plugin searches for `ConfigMaps` with the label `perses.dev/resource: "true"` and imports them into Perses. The `ConfigMap` must contain a key like `my-dashboard.json` with the dashboard JSON content. Please [refer this section](https://github.com/cloudoperators/greenhouse-extensions/blob/main/perses/README.md#example-dashboard-and-datasource-config) for more information.

A guide on how to create custom dashboards on the UI can be found [here](https://github.com/cloudoperators/greenhouse-extensions/blob/main/perses/README.md#create-a-custom-dashboard).

## Configuration


## Create a custom dashboard

1. Add a new Project by clicking on **ADD PROJECT** in the top right corner. Give it a name and click **Add**.
2. Add a new dashboard by clicking on **ADD DASHBOARD**. Give it a name and click **Add**.
3. Now you can add variables, panels to your dashboard.
4. You can group your panels by adding the panels to a Panel Group.
5. Move and resize the panels as needed.
6. Watch [this gif](https://perses.dev/) to learn more.
7. You do not need to add the kube-monitoring datasource manually. It will be automatically discovered by Perses.
8. Click **Save** after you have made changes.
9. Export the dashboard.
   - Click on the **{}** icon in the top right corner of the dashboard.
   - Copy the entire JSON model.
   - See the next section for detailed instructions on how and where to paste the copied dashboard JSON model.


## Add Dashboards as ConfigMaps

By default, a sidecar container is deployed in the Perses pod. This container watches all configmaps in the cluster and filters out the ones with a label `perses.dev/resource: "true"`. The files defined in those configmaps are written to a folder and this folder is accessed by Perses. Changes to the configmaps are continuously monitored and are reflected in Perses within 10 seconds.

A recommendation is to use one configmap per dashboard. This way, you can easily manage the dashboards in your git repository.

#### Recommended folder structure for dashboards

*Folder structure:*
```bash
dashboards/
├── dashboard1.json
├── dashboard2.json
├── prometheusdatasource1.json
├── prometheusdatasource2.json
templates/
├──dashboard-json-configmap.yaml
```

*Helm template to create a configmap for each dashboard:*
```yaml
{{- range $path, $bytes := .Files.Glob "dashboards/*.json" }}
---
apiVersion: v1
kind: ConfigMap

metadata:
  name: {{ printf "%s-%s" $.Release.Name $path | replace "/" "-" | trunc 63 }}
  labels:
    perses.dev/resource: "true"

data:
{{ printf "%s: |-" $path | replace "/" "-" | indent 2 }}
{{ printf "%s" $bytes | indent 4 }}

{{- end }}
```
