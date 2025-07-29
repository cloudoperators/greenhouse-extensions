---
title: OpenSearchHighMemoryUsage
weight: 20
---

# OpenSearchHighMemoryUsage

## Problem

The OpenSearch cluster is experiencing high memory usage, which can lead to performance degradation, out-of-memory errors, and potential service unavailability.

## Impact

- Reduced cluster performance and response times
- Potential out-of-memory errors and pod restarts
- Service degradation for applications depending on the cluster
- Risk of cluster instability if memory usage remains high

## Diagnosis

1. **Check cluster health**:

   - **How to access Dev Tools:**
     1. In the Greenhouse UI, go to **Organization** > **Plugins** > **opensearch <cluster>**.
     2. Under **External Links**, click on **opensearch-dashboards-external** to open OpenSearch Dashboards.
     3. Log in if prompted.
     4. In the OpenSearch Dashboards menu (left side), scroll down to **Management** and then click on **Dev Tools**.

   - In the Dev Tools console, run:

     ```http
     GET _cluster/health
     ```

2. **Check JVM stats for all nodes**:

   ```http
   GET _nodes/stats/jvm
   ```

3. **Monitor JVM stats for a specific node**:

   ```http
   GET _nodes/stats/jvm
   ```

4. **Check for memory-intensive operations**: Look for operations that consume high memory:
   - Large aggregations
   - Complex search queries
   - Bulk indexing operations
   - Index recovery operations

4. **Delete index**: Deleting is done via the OpenSearch Dev Tools:

   ```http
   DELETE /<index-name>
   ```

   Replace `<index-name>` with the actual name of the index.
   - ⚠️ **Warning:** Deleting an index is a last resort and will result in permanent data loss for that index. Only proceed if the index is unrecoverable and all other recovery options have failed. If possible, take a snapshot/backup before deletion, even if the index is partially damaged.

## Resolution Steps

1. **Identify memory-intensive processes**: Check which operations are consuming high memory:

   - In the Dev Tools console, run:

     ```http
     GET _nodes/stats/jvm
     ```

2. **Optimize queries and aggregations**: If high memory is due to complex operations:
   - Review and optimize search queries
   - Break down large aggregations
   - Use pagination for large result sets
   - Implement proper indexing strategies

3. **Adjust JVM heap settings**: If memory usage is consistently high:
   - Review and adjust JVM heap settings
   - Consider increasing heap size if resources allow
   - Monitor heap usage patterns

4. **Scale cluster resources**: If memory usage is consistently high:
   - Add more nodes to the cluster
   - Increase memory limits for existing nodes
   - Consider horizontal scaling

5. **Monitor and adjust**: Continue monitoring memory usage and adjust resources as needed.

6. **Contact support**: If issues persist, investigate further or seek assistance from your operations team.
