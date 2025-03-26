---
title: Logs are Missing
weight: 20
---

## Root Cause Analysis

Determine if the lack of sent logs is expected:
- Check if the Plugin is up and running via the Greenhouse Dashboard.
- Check if there are other alerts that would indicate a lack of sent logs (`CrashLoopBackoff`, `ErrImagePull`).
- Check operational logs for the Pods (requests failing, incorrect credentials for logshipping).
- Check that the defined backend (e.g. OpenSearch) is ready to receive logs e.g. by checking if pods of the backend are in `RUNNING` state:
    ```
    kubectl  k get pods -n <backend-namespace> -o wide
    ```

## Solution

### 1. In Case of Expected Downtime
Mute the alert temporarily via Greenhouse until the plugin is healthy again and notify the responsible service owner.

### 2. In Case of an Unexpected Downtime

#### 2.1 Are other Pods (not 'logs-collector' ones) working?
If yes, it could be a connection error. Investigate it by checking the errors of the 'logs-collector' Pods in the designated namespace:
```
# Retrieves all pods, find the failing pod.
kubectl get pods -n <namespace> -o wide | grep -e 'collector'
```

#### 2.2 If you find a problematic Pod, errors in the log outputs, or other issues. You should also check the logs of a particular _container_ of the problematic Pod for errors, by running:
```
kubectl logs <failing-logs-collector> -c otc-container -n <namespace>
```

#### 2.3 Delete the affected OpenTelemetry Pods in the namespace of the controlplane.
```
# Delete a specific pod
kubectl delete pod <failing-logs-collector> -n <namespace>
```
### 3. Ensure that the Pods has been recreated by the operator after some time

### 4. Observe the logs for the Pod to ensure that the problem has been resolved.

### 5. Done.
