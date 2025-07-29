---
title: OpenSearchNodeDown
weight: 20
---

# OpenSearchNodeDown

## Problem

OpenSearch main or data pods are crash-looping due to full disk or other issues, causing `KubernetesPodRestartingTooMuch` alerts or pod failures.

## Impact

- Cluster instability and potential data loss
- Reduced cluster performance and availability
- Potential service degradation for applications depending on the cluster

## Diagnosis

1. **Check node status**:

   - Use Kubernetes to check pod status:

     ```bash
     kubectl get pods -n opensearch-logs
     ```

2. **Check cluster health**:

   - **How to access Dev Tools:**
     1. In the Greenhouse UI, go to **Organization** > **Plugins** > **opensearch <cluster>**.
     2. Under **External Links**, click on **opensearch-dashboards-external** to open OpenSearch Dashboards.
     3. Log in if prompted.
     4. In the OpenSearch Dashboards menu (left side), scroll down to **Management** and then click on **Dev Tools**.

   - In the Dev Tools console, run:

     ```http
     GET _cat/nodes?v
     ```

     ```http
     GET _cluster/health
     ```

3. **Check volume status**: If the pod is failing due to disk space issues, it may not be possible to check the volumes content from the OpenSearch pod directly.

## Resolution Steps

1. **Access the PVC for cleanup using kubectl debug**: If the pod is crash-looping and you need to manually clean up files on the volume, use the following command to start a debug container attached to the existing pod (if possible):

   ```bash
   kubectl debug -it <pod-name> -n opensearch-logs --image=alpine --target=<container-name> -- /bin/sh
   ```

   If the pod is not running and you need to create a new debug pod to mount the PVC, you may need to create a temporary pod manifest that mounts the PVC, or use your cluster's preferred debug workflow.

   Once inside the debug shell, you can check disk usage and clean up files as needed:

   ```bash
   df -h
   ls -lah /usr/share/opensearch/data
   # Remove large or unnecessary files if you are certain they are not needed
   ```
