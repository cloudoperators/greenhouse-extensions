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
    - name: scanner.k8s_cluster_name
      value: <target-cluster>
    - name: scanner.k8s_cluster_region
      value: <target-cluster-region>
    - name: scanner.schedule
      value: "0 * * * *"
    - name: scanner.scanner_timeout
      value: "30s"
    - name: scanner.support_group_label
      value: "ccloud/support-group"
    - name: scanner.service_label
      value: "ccloud/service"
    - name: scanner.default_keppel_registry
      value: "keppel.com"
    - name: image.repository
      value: "ghcr.io/cloudoperators/heureka-scanner-k8s-assets"
    - name: image.tag
      value: "latest"
    - name: image.pullPolicy
      value: "IfNotPresent"
```