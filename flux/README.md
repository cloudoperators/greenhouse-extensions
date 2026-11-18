---
title: Flux
---

This Plugin deploys the [Flux](https://fluxcd.io) GitOps toolkit controllers via the
[fluxcd-community flux2](https://github.com/fluxcd-community/helm-charts) Helm chart.

It installs the source-controller, kustomize-controller, helm-controller,
notification-controller and source-watcher. The image-automation-controller and
image-reflector-controller are disabled by default.

## Example

To instantiate the plugin create a `Plugin` like:

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: flux
spec:
  pluginDefinitionRef: 
    name: flux
  optionValues:
    - name: kustomizeController.container.additionalArgs
      value:
        - --feature-gates=ExternalArtifact=true,ObjectLevelWorkloadIdentity=true
    - name: helmController.container.additionalArgs
      value:
        - --feature-gates=ObjectLevelWorkloadIdentity=true
```

## Options

| Name | Description | Default |
|------|-------------|---------|
| `imageAutomationController.create` | Deploy the image-automation-controller | `false` |
| `imageReflectionController.create` | Deploy the image-reflector-controller | `false` |
| `sourceWatcher.create` | Deploy the source-watcher controller | `true` |
| `policies.create` | Create the Flux NetworkPolicies | `true` |
| `rbac.create` | Create the Flux RBAC resources | `true` |
| `rbac.roleRef.name` | ClusterRole the Flux controllers are bound to | `cluster-admin` |