---
title: Kubernetes Gateway API
---

This plugin installs the [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) CRDs (standard channel) into a cluster.

The Gateway API is the next-generation Kubernetes ingress, load balancing, and service mesh API. It is designed to be expressive, extensible, and role-oriented.

## Example

To instantiate the plugin create a `Plugin` like:

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: k8s-gateway-api
spec:
  pluginDefinitionRef:
    name: k8s-gateway-api
```
