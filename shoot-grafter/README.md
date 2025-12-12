---
title: Shoot-grafter
---

## Example Plugin

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: shoot-grafter
spec:
  displayName: Shoot Grafter
  optionValues:
  - name: image.registry
    value: ghcr.io/cloudoperators
  pluginDefinitionRef:
    kind: ClusterPluginDefinition
    name: shoot-grafter
  releaseName: shoot-grafter
  releaseNamespace: greenhouse # shoot-grafter is a ClusterPluginDefinition
```

Read up the shoot-grafter [documentation](https://github.com/cloudoperators/shoot-grafter/blob/main/README.md).
