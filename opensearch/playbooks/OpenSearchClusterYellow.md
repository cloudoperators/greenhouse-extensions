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

   There are three statefulsets: one for client nodes, data nodes, and master nodes.

2. **Check for MultiAttachErrors**: If not all pods are ready, check the kubernetes events for the namespace for potential "MultiAttachErrors". If there are errors and they do not resolve within 5-10 minutes, investigate the volume attachment issues.

   You can get the volume information for troubleshooting via:
   ```bash
   kubectl get pvc -n opensearch-logs
   kubectl describe pvc <pvc-name> -n opensearch-logs
   kubectl describe pv <pv-name>
   ```

   Investigate the volume attachment issues and resolve them.

3. **Check cluster monitoring dashboard**: Check the OpenSearch monitoring dashboard for any shard initialization, shard relocation activities for the respective OpenSearch cluster.

## Resolution Steps

1. **Wait for ongoing activities**: If there are ongoing shard activities, wait for the cluster to finish these activities.

2. **Check for disk space issues**: If the cluster is in status YELLOW and there is no resync happening, check if:
   - Diskspace is over 85%, no sync possible

3. **Fix resync retry exceeded**: If resync retry exceeded, fix with:
   ```bash
   curl -u $USER:$PW -XPOST http://localhost:9200/_cluster/reroute?retry_failed=true

   # or

   curl -u $USER:$PW -XPOST https://opensearch-logs-client.scaleout.qa-de-1.cloud.sap:9200/_cluster/reroute?retry_failed=true
   ```

4. **Delete unrecoverable indexes**: Delete indexes which cannot be resynced anymore via the OpenSearch Dev Tools.

5. **Contact support**: If issues persist, investigate further or seek assistance from your operations team.
