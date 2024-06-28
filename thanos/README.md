---
title: Thanos
---

This plugin deploys the following Thanos components:

* Query
<!--* Query Frontend-->
<!--* Compact-->
<!--* (Ruler)-->
<!--* Storegateway-->

Requirements:
* thanos-sidecar enabled in Prometheus (usually with [Prometheus Operator](https://prometheus-operator.dev/))

# Owner

1. Tommy Sauer (@viennaa) 
2. Richard Tief (@richardtief) 
3. Martin Vossen (@artherd42) 

### Thanos parameters

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |

## Examples

### Thanos Querier

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: thanos
spec:
  pluginDefinition: thanos
  disabled: false
  clusterName: $YOURNAME 
```
