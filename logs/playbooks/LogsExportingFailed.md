---
title: Logs exporting is failing
weight: 20
---

## Root Cause Analysis

Determine if the lack of sent logs is expected:
- Check if the Plugin is up and running via the Greenhouse Dashboard.
- Check if there are other alerts that would indicate a lack of sent logs (`CrashLoopBackoff`, `ErrImagePull`).
- Check operational logs for the pods (requests failing, incorrect credentials for logshipping).
- Check that the sink (e.g. OpenSearch) is ready to receive logs e.g. by checking if pods of the backend are in `RUNNING` state:
    ```
    kubectl  k get pods -n <backend-namespace> -o wide
    ```

## Solution

### In Case of Expected Downtime
Mute the alert temporarily via Greenhouse until the plugin is healthy again and notify the responsible service owner.

### In Case of an Unexpected Downtime

If other pods in the cluster are working, check the operational logs for any error messages:
```bash
  kubectl logs daemonset/logs-collector -n logs | grep -i 'error'
```

Determine the cause of action accordingly, some previously observed issues.

#### Is it ConfigMap related?
Configuration issue, syntax problem, indentation issue within the pipeline
  1. Check configMap for the running collector. Make sure that the collector is running the latest configMap:
```bash
  kubectl get ds/logs-collector -n logs -o=jsonpath='{.spec.template.spec.volumes[].configMap.name}'
  kubectl get cm -n logs --sort-by=.metadata.creationTimestamp
```
  1. Action: update configMap, deploy a fix.
  1. Action: Restart the logs-collector:
```bash
    kubectl rollout restart daemonset/logs-collector -n logs
```

#### Is it a connection issue between the collector and the sink?
There could be an issue with the throttling, latency, connection timeouts when exporting to the sink
   1. Check if the sink is running and accepting connections
   1. Check if the sink enough resources to accept new logs (cpu, memory, storage).
   1. Action: Refer to a team or playbook relating to the sink (ask in slack `#team_observability` or the on-call observability person).
#### Is it a authentication/authorization issue between the collector and the sink?
Permission issues with missing, wrong or out-of-sync credentials
  1. Check which credentials is being used by checking the secret:
```bash
    kubectl get ds/logs-collector -n logs -o=jsonpath='{.spec.template.spec.containers[].envFrom[].secretRef.name}'
```
  1. Action: Update secrets for credentials used by the collector and update accordingly.
  1. Action: Restart the logs-collector:
```bash
    kubectl rollout restart daemonset/logs-collector -n logs
```

### 3. Ensure that the pods has been recreated by the operator after some time

### 4. Observe the logs for the Pod to ensure that the problem has been resolved.

### 5. Done.
