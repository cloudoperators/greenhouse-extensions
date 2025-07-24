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

4. **Monitor via dashboard**: Check the OpenSearch Manager dashboard for:
   - Node CPU usage
   - Active operations
   - Query performance

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
