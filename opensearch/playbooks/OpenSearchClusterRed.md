---
title: OpenSearchClusterRed
weight: 20
---

# OpenSearchClusterRed

## Problem

The OpenSearch cluster is in status RED, which means there are one or more indexes which cannot be opened because one or more shards are missing.

## Impact

- Cluster is unavailable for read/write operations
- Data loss may occur if shards cannot be recovered
- Service degradation for applications depending on the cluster

## Diagnosis

1. Check if there are any ongoing maintenance operations or volume attachment issues in the cluster.

2. Check via OpenSearch Dev Tools if the cluster is syncing again after Kubernetes cluster issues have been resolved.

3. Check via OpenSearch Dev Tools for affected indexes:

   - Use the Dev Tools console to query cluster health

   - How to access Dev Tools and check status:
     1. In the Greenhouse UI, go to **Organization** in the left menu, then **Plugins** > **opensearch <cluster>**.
     2. Under **External Links**, click on **opensearch-dashboards-external** to open OpenSearch Dashboards.
     3. Log in if prompted.
     4. In the OpenSearch Dashboards menu (left side), scroll down to **Management** and then click on **Dev Tools**.
     5. In the Dev Tools console, enter the following commands:

        - To check overall cluster health:

          ```http
          GET _cluster/health
          ```

        - To list indices and their health:

          ```http
          GET _cat/indices?v
          ```

        - To find indices with missing shards:

          ```http
          GET _cat/shards?v
          ```

        - To check node disk usage:

          ```http
          GET _cat/nodes?v&h=name,diskAvail,diskUsedPercent
          ```

   - Look for indices with missing shards
   - If you find an index with both primary and backup shards missing, it means this index cannot be recovered

## Resolution Steps

1. **Wait for maintenance**: If a maintenance is running, wait until it has finished rebooting all nodes in the cluster.

2. **Check volume attachment issues**: If there are volumes stuck for a couple of minutes, check the Kubernetes events:

   ```bash
   kubectl get events -n opensearch-logs
   ```

   Investigate the volume attachment issues and resolve them.

3. **Monitor cluster recovery**: If cluster is resyncing, wait until the cluster is green again. If resync stops, investigate the underlying cause and resolve it.

4. **Check disk usage**: Check if disks are nearly full using the OpenSearch Dev Tools to query node stats. There is a hard stop at 90% disk usage.

5. **Delete missing special indexes**: If this is a special index (ones with a dot in front of the name like `.opensearch...`), use the Dev Tools to delete the index.

   - **Delete an index:**

     ```http
     DELETE /<index-name>
     ```

   Replace `<index-name>` with the actual name of the index you want to delete.

6. **Force cluster reroute**: If the cluster is not recovering and just stuck after deleting missing dot indexes, execute two additional commands via the OpenSearch Dev Tools:

   - **Retry failed shard allocations:**

     ```http
     PUT _cluster/reroute?retry_failed=true
     ```

   - **Enable cluster routing allocation:**

     ```json
     PUT _cluster/settings
     {
       "persistent": {
         "cluster.routing.allocation.enable": "all"
       }
     }
     ```

7. **Temporarily increase recovery settings**: To speed up shard recovery, you can temporarily increase the number of concurrent recoveries. Run the following in Dev Tools:

   ```json
   PUT _cluster/settings
   {
     "transient": {
       "cluster.routing.allocation.node_concurrent_recoveries": 10,
     }
   }
   ```

   Adjust the values as needed for your environment. After the cluster is green and recovery is complete, revert these settings to their defaults to avoid overloading your nodes.

8. **Contact support**: If the cluster doesn't start rerouting after these steps, investigate further or seek assistance from your operations team.
