---
title: OpenSearchHighCPUUsage
weight: 20
---

# OpenSearchHighCPUUsage

## Problem

The OpenSearch cluster is experiencing high CPU usage, which can lead to performance degradation and potential service unavailability.

## Impact

- Reduced cluster performance and response times
- Potential service degradation for applications depending on the cluster
- Increased resource consumption and costs
- Risk of cluster instability if CPU usage remains high

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

2. **Check OS stats for all nodes**:

   ```http
   GET _nodes/stats/os
   ```

3. **Check for ongoing operations**: Look for heavy operations like:
   - Large index operations
   - Bulk indexing operations
   - Complex search queries
   - Index recovery operations

4. **Monitor via dashboard**: You can find the OpenSearch Monitoring dashboard in **Perses** under the **default** project. In the Greenhouse UI, go to **Organization** > **Plugins** > **perses <cluster>**, then under **External Links** look for **perses**. Open the **OpenSearch Monitoring** dashboard.

   - **What to look for:**
     - **CPU Usage panel:** Shows per-node CPU usage over time. Identify nodes with consistently high CPU usage.
     - **Cluster Status panel:** Check if the cluster is in a healthy state (Green/Yellow/Red).
     - **Total Nodes, Main Nodes, Data Nodes, Client Nodes:** Ensure the expected number of nodes are up and healthy.
     - **JVM Memory Usage panel:** High memory pressure can sometimes correlate with high CPU usage.
     - **Indexing Rate and Search Rate panels:** High indexing or search rates can drive up CPU usage. Look for spikes or sustained high rates.
     - **Operator Status and Reconcile Time:** If the operator is unhealthy or slow, it may impact cluster performance.

   Use these panels to correlate high CPU usage with cluster health, node status, and workload patterns. Investigate nodes or time periods with abnormal CPU usage for further troubleshooting.

## Resolution Steps

1. **Identify high CPU processes**: Check which operations are consuming high CPU:

   - In the Dev Tools console, run:

     ```http
     GET _nodes/stats/os
     ```

2. **Optimize search queries**: If high CPU is due to complex queries:
   - Review and optimize search queries
   - Add proper indexing
   - Use query caching where appropriate

3. **Scale cluster resources**: If CPU usage is consistently high:
   - Add more nodes to the cluster
   - Increase CPU limits for existing nodes
   - Consider horizontal scaling

4. **Monitor and adjust**: Continue monitoring CPU usage and adjust resources as needed.

5. **Contact support**: If issues persist, investigate further or seek assistance from your operations team.
