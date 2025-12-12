# Perses Service Down

## Problem
The Perses service is currently **offline**.

It is either completely stopped, crashing repeatedly, or running but refusing to respond to requests.

## Impact

* **Service Outage:** Users cannot access or view any Perses dashboards.

## Diagnosis
Follow these steps to determine if the service is crashed, "hung," running on a bad node, or turned off.

### 1. Check Pod Status
Identify the specific Perses instance referenced in the alert.

* **Option A: Check the specific namespace** (from the alert label `namespace`):

```bash
  kubectl get pods -n <namespace> -l app.kubernetes.io/name=perses
```

**Analyze the Output:**

  * **`CrashLoopBackOff`:** The application is starting but failing immediately. **Go to Step 3**.
  * **`Running`:** The application appears healthy to Kubernetes. **Go to Step 2**.
  * **`Pending`:** The cluster is out of resources or the node is tainted. **Go to Step 2**.
  * **No resources found:** The list is empty. **Go to Step 4**.

### 2\. Verify Node Health

Sometimes a pod appears `Running`, but the underlying Node is disconnected (`NotReady`), causing network traffic to fail.

1.  Find the Node where the pod is running:
    ```bash
    kubectl get pods -n <namespace> -l app.kubernetes.io/name=perses -o wide
    ```
2.  Check the status of that Node:
    ```bash
    kubectl get node <node-name-from-previous-step>
    ```
      * **If Status is `NotReady`:** The node is down. **Go to Resolution C**.
      * **If Status is `Ready`:** The node is fine, but the process is hung. **Go to Resolution D**.

### 3\. Inspect Application Logs

If the pod status is `CrashLoopBackOff` or `Error`, check the logs to find the root cause.

```bash
kubectl logs statefulset/perses -n <namespace> --all-containers
```

### 4\. Check if Service is Scaled Down

If **Step 1** returned "No resources found," verify if the StatefulSet was scaled to 0 (maintenance or accident).

```bash
kubectl get statefulset -n <namespace> -l app.kubernetes.io/name=perses
```

  * **Result `READY 0/0`:** The service is stopped. **Go to Resolution A**.

## Resolution Steps

### Scenario A: Service Scaled to 0 (Stopped)

**Diagnosis:** StatefulSet shows `0/0` replicas.

1.  **Check Context:** Verify if this is a planned maintenance.
      * *If Planned:* **Silence the alert** in Alertmanager.
      * *If Accidental:* Start the service:
        ```bash
        kubectl scale statefulset <statefulset-name> --replicas=1 -n <namespace>
        ```

### Scenario B: Configuration Error (CrashLoopBackOff)

**Diagnosis:** Logs show syntax errors or panic.

1.  Rollback the Helm release if a recent change caused the crash:
    ```bash
    helm rollback <release-name> 0 -n <namespace>
    ```

### Scenario C: Node Failure

**Diagnosis:** The Node hosting the pod is `NotReady`.

1.  Force delete the pod. Since the node is unresponsive, a standard delete might hang.
    ```bash
    kubectl delete pod <pod-name> -n <namespace> --grace-period=0 --force
    ```
    *Result: The StatefulSet controller will immediately reschedule the pod onto a healthy node.*

### Scenario D: Hung Process (Unresponsive)

**Diagnosis:** Pod is `Running`, Node is `Ready`, but `up == 0`.

1.  Force a restart to clear the application deadlock:
    ```bash
    kubectl rollout restart statefulset <statefulset-name> -n <namespace>
    ```