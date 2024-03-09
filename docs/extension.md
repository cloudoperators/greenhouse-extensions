# Greenhouse extension

The Greenhouse application management is based on an extendable `Plugin` catalog.

This guide provides an overview of the minimal configuration required to create a Greenhouse `Plugin`.  
See the [API reference](https://github.com/pages/cloudoperators/greenhouse/docs/apidocs/index.html) for see detailed documentation of the following resources.

## Overview

A Greenhouse [Plugin](https://github.com/pages/cloudoperators/docs/apidocs/index.html#crd-Plugin) might consist of a backend defined via a Helm chart and a UI application part.  
Both parts and a set of instance-specific options are defined via the `Plugin` CRD as outlined below.

Essentially, a Plugin requires the following fields:
```
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: ...
spec:
  version: ...              # Semantic version of the plugin.
  description: ...          # Plugin description to be shown to end-users
  helmChart: {...}          # Plugin backend configuration
  uiApplication: {...}      # UI component to be shown in the dashboard
  options: [...]            # Configuration options to be passed to both backend and frontend
```

A plugin might require additional Kubernetes resources.  
These are not part of the plugin specification, but are provided either as a [Helm chart](https://helm.sh/) or via a [Kustomize base](https://kustomize.io/) that is stored in an external artifact registry.  
The values provided in the *Plugin* and *PluginConfig* are passed to respective mechanism during installation and upgrade.

Additionally, based on the respective context, the following set of values is always passed to the chart via Helm:
```yaml
greenhouse:
  clusterNames:
    - <name>
    - ...
  teams:
    - <name>
    - ...
```

## Develop a Plugin

Greenhouse provides a local environment covering all aspects of Plugin development.
See the [local development environment guide](./../dev-env) on how to get started. 

### Backend

Backend components are specified via a Helm chart and configured within the `Plugin.spec.helmChart` field.  
Mandatory values **must** and optional can be made known to the Plugin for validation reasons via the `Plugin.spec.options`.

Given an existing Helm chart, the `plugin.yaml` structure can be generated via the `greenhousectl plugin generate [Helm chart path] [output path]` command.

### UI

UI components are essential to visualize Plugin specific content in the Greenhouse dashboard.

They are build using the [Juno framework](https://github.com/sapcc/juno).
Building and publishing UI components within this repository can ae automated by adding to the `PLUGIN_UIS` in the [pipeline definition](./ci/pipeline.yaml.erb#L15)
There you need to specify the folder the ui lives in.

The pipeline expects all tests to run successfully via
```
npm run test
```
before building and deploying the app via
```
npm run build
```
