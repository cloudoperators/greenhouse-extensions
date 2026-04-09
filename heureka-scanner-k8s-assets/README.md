The Kubernetes Assets Scanner is a tool designed to scan and collect information about services, pods, and containers running in a Kubernetes cluster.

### Example Plugin ###

```
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: heureka-scanner-k8s-assets
  namespace: <your-greenhouse-namespace>
spec:
  pluginDefinition: heureka-scanner-k8s-assets
  displayName: "Heureka K8s Assets Scanner"
  clusterName: <target-cluster>
  releaseNamespace: <target-namespace>
  disabled: false
  optionValues:
    - name: scanner.api_token
      valueFrom:
        secret:
          name: <name>
          key: <key>
    - name: scanner.heureka_url
      value: "https://your-heureka-api.example.com"
    - name: scanner.schedule
      value: "0 0 * * *"
    - name: scanner.scanner_timeout
      value: "30m"
```