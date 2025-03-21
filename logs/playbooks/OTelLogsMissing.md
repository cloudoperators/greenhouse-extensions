---
title: Logs are Missing
weight: 20
---

# Root Cause Analysis

Determine if the lack of sent logs is expected:
- Check if the Plugin is up and running via the Greenhouse Dashboard.
- Check if there are other alerts that would indicate a lack of sent logs (CrashLoopBackoff, ErrImagePull).
- Check operational logs for the Pods (requests failing, incorrect credentials for logshipping).
- Check that the backend (e.g. OpenSearch) is ready to receive logs.

## Solution

### 1. In Case of Expected Downtime
Mute the alert temporarily via Greenhouse until the plugin is healthy again and notify the team responsible service owner.

### 2. In Case of an Unexpected Downtime

#### 2.1 If it is a connection error and other Pods are working, investigate the errors by checking the Pods in the designated namespace:
```
# Retrieves all pods, find the failing pod.
kubectl  k get pods -n <namespace> -o wide | grep -e 'collector'
```

#### 2.2 You can also check the logs of the associated underlying container for more errors by running:
```
kubectl logs <failing-logs-collector> -c otc-container
```

#### 2.3 Delete the affected OpenTelemetry Pods in logs namespace of the controlplane Kubernetes.
```
# Delete a specific pod
kubectl  delete pod <failing-logs-collector> -n logs
```
### 3. Ensure that the Pods has been recreated by the operator after some time

### 4. Observe the logs for the Pod to ensure that the problem has been resolved.

### 5. Done.
