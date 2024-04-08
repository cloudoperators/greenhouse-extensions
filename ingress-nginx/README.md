---
title: Ingress NGINX
---

This plugin contains the [ingress NGINX controller](https://github.com/kubernetes/ingress-nginx).

## Example

To instantiate the plugin create a `Plugin` like:

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: ingress-nginx
spec:
  pluginDefinition: ingress-nginx-v4.4.0
  values:
    - name: controller.service.loadBalancerIP
      value: 1.2.3.4
```
