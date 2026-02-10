---
title: Supernova
---

Learn more about the [_Supernova_](https://github.com/cloudoperators/juno/tree/main/apps/supernova) Plugin, an advanced user interface for Prometheus Alertmanager.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).


## Overview

This plugin provides the stand alone UI application Supernova and needs an [_Prometheus Alertmanager_](https://prometheus.io/docs/alerting/latest/alertmanager/) to be queried. Provisioning of the Alertmanager is not part of this plugin.

- [Supernova](https://github.com/cloudoperators/juno/tree/main/apps/supernova)

This Plugin usually is deployed on the greenhouse central cluster, one per greenhouse organization.

## Disclaimer

This is not meant to be a comprehensive package that covers all scenarios. If you are an expert, feel free to configure the plugin according to your needs.

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick start

This guide provides a quick and straightforward way to use **alerts** as a Greenhouse Plugin on your Kubernetes cluster.

**Prerequisites**

- A running Greenhouse cluster. [Greenhouse Docs](https://cloudoperators.github.io/greenhouse/docs/)
- alerts plugin *OR* standalone Alertmanager URL


**Step 1:**

Create and specify a `Plugin` resource in your Greenhouse central cluster according to the [examples](#examples).

**Step 2:**

After the installation, you can access the **Supernova** UI by navigating to the tab in the Greenhouse dashboard. Every instance of the Supernova plugin will provide a new entry in the Greenhouse dashboard side panel. 'displayName' will be used as button label.

## Configuration

### Supernova options

`theme`: Override the default theme. Possible values are `"theme-light"` or `"theme-dark"` (default)

`endpoint`: Alertmanager API Endpoint URL `/api/v2`. Should be one of `alerts.alertmanager.ingress.hosts`

`silenceExcludedLabels`: SilenceExcludedLabels are labels that are initially excluded by default when creating a silence. However, they can be added if necessary when utilizing the advanced options in the silence form.The labels must be an array of strings. Example: `["pod", "pod_name", "instance"]`

`filterLabels`: FilterLabels are the labels shown in the filter dropdown, enabling users to filter alerts based on specific criteria. The 'Status' label serves as a default filter, automatically computed from the alert status attribute and will be not overwritten. The labels must be an array of strings. Example: `["app", "cluster", "cluster_type"]`

`predefinedFilters`: PredefinedFilters are filters applied through in the UI to differentiate between contexts through matching alerts with regular expressions. They are loaded by default when the application is loaded. The format is a list of objects including name, displayname and matchers (containing keys corresponding value). Example:

```json
[
  {
    "name": "prod",
    "displayName": "Productive System",
    "matchers": {
      "region": "^prod-.*"
    }
  }
]
```

`silenceTemplates`: SilenceTemplates are used in the Modal (schedule silence) to allow pre-defined silences to be used to scheduled maintenance windows. The format consists of a list of objects including description, editable_labels (array of strings specifying the labels that users can modify), fixed_labels (map containing fixed labels and their corresponding values), status, and title. Example:

```json
"silenceTemplates": [
    {
      "description": "Description of the silence template",
      "editable_labels": ["region"],
      "fixed_labels": {
        "name": "Marvin",
      },
      "status": "active",
      "title": "Silence"
    }
  ]
```

## Examples

### Deploy Supernova

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: supernova
spec:
  pluginDefinition: supernova
  disabled: false
  displayName: Alerts
  optionValues:
      value: false
    - name: endpoint
      value: https://alertmanager.dns.example.com/api/v2
    - name: filterLabels
      value:
        - job
        - severity
        - status
    - name: silenceExcludedLabels
      value:
        - pod
        - pod_name
        - instance
```
