---
title: OpenSearchClusterYellow
weight: 20
---

# OpenSearchClusterYellow

## Problem

The OpenSearch cluster is reporting status YELLOW, which indicates that some replica shards are not allocated or there are ongoing shard activities that need to be resolved.

## Impact

- Reduced cluster performance and availability
- Potential data loss if replica shards cannot be allocated
- Service degradation for applications depending on the cluster

## Diagnosis

1. **Check if all opensearch pods are up**:

   ```bash
   kubectl get sts -n opensearch-logs
   NAME                     READY   AGE
   opensearch-client   3/3     407d
   opensearch-data     14/14   413d
   opensearch-main     3/3     413d
   ```

   There are three statefulsets: one for client nodes, data nodes, and main nodes.

2. **Check for MultiAttachErrors**: If not all pods are ready, check the kubernetes events for the namespace for potential "MultiAttachErrors". If there are errors and they do not resolve within 5-10 minutes, investigate the volume attachment issues.

   You can get the volume information for troubleshooting via:

   ```bash
   kubectl get pvc -n opensearch-logs
   kubectl describe pvc <pvc-name> -n opensearch-logs
   kubectl describe pv <pv-name>
   ```

   Investigate the volume attachment issues and resolve them.

3. **Check cluster monitoring dashboard**: Check the OpenSearch monitoring dashboard for any shard initialization, shard relocation activities for the respective OpenSearch cluster.

   - You can find the dashboard in **Perses**. The link for it is in the Greenhouse UI: go to **Organization** > **Plugins** > **perses <cluster>**, then under **External Links** look for **perses**.

4. **Use OpenSearch Dev Tools for further diagnosis and actions:**

   - **How to access Dev Tools:**
     1. In the Greenhouse UI, go to **Organization** > **Plugins** > **opensearch <cluster>**.
     2. Under **External Links**, click on **opensearch-dashboards-external** to open OpenSearch Dashboards.
     3. Log in if prompted.
     4. In the OpenSearch Dashboards menu (left side), scroll down to **Management** and then click on **Dev Tools**.

   - **Check which shards are affected:**

     ```http
     GET _cat/shards?v
     ```

     Look for shards in the `UNASSIGNED` or `INITIALIZING` state. Check the `node` column to see where shards are allocated.

   - **Ensure shards are not on client nodes:**
     - Client nodes typically have names like `opensearch-client`.
     - In the output of the above command, ensure that primary and replica shards are not allocated to client nodes.

   - **Exclude client nodes from shard allocation:**
     - If needed, you can exclude client nodes by setting a cluster allocation filter. For example, if your client nodes have the attribute `node.attr.client: true`, run:

       ```json
       PUT _cluster/settings
       {
         "transient": {
           "cluster.routing.allocation.exclude._name": "opensearch-client*"
         }
       }
       ```

     - Adjust the value to match your client node naming pattern.

   - **Increase recovery speed temporarily:**

     ```json
     PUT _cluster/settings
     {
       "transient": {
         "cluster.routing.allocation.node_concurrent_recoveries": 10,
       }
     }
     ```

     - Adjust values as needed. Remember to revert these settings after recovery is complete.

   - **Force reroute to retry failed allocations:**

     ```http
     POST _cluster/reroute?retry_failed=true
     ```

   - **Delete unrecoverable indexes:**
     - If an index cannot be resynced, delete it with:

       ```http
       DELETE /<index-name>
       ```

     - Replace `<index-name>` with the actual name of the index.
     - ⚠️ **Warning:** Deleting an index is a last resort and will result in permanent data loss for that index. Only proceed if the index is unrecoverable and all other recovery options have failed. If possible, take a snapshot/backup before deletion, even if the index is partially damaged.

## Resolution Steps

1. **Wait for ongoing activities**: If there are ongoing shard activities, wait for the cluster to finish these activities.

2. **Check for disk space issues**: If the cluster is in status YELLOW and there is no resync happening, check if:
   - Diskspace is over 85%, no sync possible

3. **Fix resync retry exceeded**: If resync retry exceeded, fix with:

   ```http
   POST _cluster/reroute?retry_failed=true
   ```

   Run this in the OpenSearch Dev Tools console as described above.

4. **Delete unrecoverable indexes**: Delete indexes which cannot be resynced anymore via the OpenSearch Dev Tools.

5. **Contact support**: If issues persist, investigate further or seek assistance from your operations team.
