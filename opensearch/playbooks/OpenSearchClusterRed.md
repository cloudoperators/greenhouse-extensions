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
   - Look for indices with missing shards
   - If you find an index with both primary and backup shards missing, it means this index cannot be recovered

## Resolution Steps

1. **Wait for maintenance controller**: If the maintenance controller is running, wait until it has finished rebooting all nodes in the scaleout cluster.

2. **Check volume attachment issues**: If there are volumes stuck for a couple of minutes, check the Kubernetes events:
   ```bash
   kubectl get events -n <opensearch-logs>
   ```
   Investigate the volume attachment issues and resolve them.

3. **Monitor cluster recovery**: If cluster is resyncing, wait until the cluster is green again. If resync stops, investigate the underlying cause and resolve it.

4. **Check disk usage**: Check if disks are nearly full using the OpenSearch Dev Tools to query node stats. There is a hard stop at 90% disk usage.

5. **Delete missing special indexes**: If this is a special index (ones with a dot in front of the name like `.opensearch...`), use the Dev Tools to delete the index.

6. **Force cluster reroute**: If the cluster is not recovering and just stuck after deleting missing dot indexes, execute two additional commands via the OpenSearch Dev Tools:

   a. Use `PUT` method for the path `_cluster/reroute?retry_failed=true`

   b. Use `PUT` method for the path `_cluster/settings` with the request body:
   ```json
   {
     "persistent": {
       "cluster.routing.allocation.enable": "all"
     }
   }
   ```

7. **Contact support**: If the cluster doesn't start rerouting after these steps, investigate further or seek assistance from your operations team.
