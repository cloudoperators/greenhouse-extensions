---
title: OpenSearchIndexTooLarge
weight: 20
---

# OpenSearchIndexTooLarge

## Problem

An OpenSearch index has grown too large, potentially causing rollover failures, blocked writes, or disk space issues.

## Impact

- Rollover failures for data streams
- Blocked writes due to disk watermarks or read-only settings
- Increased risk of cluster instability or data loss
- Service degradation for applications depending on the cluster

## Diagnosis

1. **Check index size and status in OpenSearch Dashboard:**
   - In the Greenhouse UI, go to **Organization** > **Plugins** > **opensearch <cluster>**.
   - Under **External Links**, click on **opensearch-dashboards-external** to open OpenSearch Dashboards.
   - Navigate to **Management > Index Management > Data streams** and select the relevant data stream (e.g. `logs-datastream`).

2. **Check ISM Policy for rollover logic:**
   - In the OpenSearch Dashboard, go to **Management > Index Management > State management policies** and review the ISM policy for the affected index (e.g. `ds-logs-ism`).
   - Note the thresholds for `index age`, `index size`, and `index doc count`.

3. **Compare index stats to ISM thresholds:**
   - In the dashboard, check if the affected index exceeds the ISM policy thresholds.

4. **Check for cluster or index read-only blocks using Dev Tools:**

   - **How to access Dev Tools:**
     1. In the OpenSearch Dashboard, go to **Management** > **Dev Tools**.
     2. In the Dev Tools console, run:

       ```http
       GET _cluster/settings?include_defaults=true
       ```

   - Look for `cluster.blocks.read_only` or `cluster.blocks.read_only_allow_delete` in the response.

5. **Check index-level blocks:**

   - In Dev Tools, run:

     ```http
     GET {index-name}/_settings?include_defaults=true
     ```

   - Replace `{index-name}` with the actual index name.

## Resolution Steps

### 1. If Rollover Failed and No Blocked Index/Cluster

- If neither the cluster nor the index is flagged as read-only, you can manually trigger a rollover:
  1. In the OpenSearch Dashboard, go to **Management > Index Management > Data streams** and select the affected data stream.
  2. Use the **Actions > Roll over** option to manually roll over the index.
  3. Verify that a new backing index is created.

### 2. If Rollover Failed and Index/Cluster is Blocked

1. **Identify the blocked backing index:**

   - In Dev Tools, run:

     ```http
     GET _cat/indices?v&h=index,health,status,store.size&s=store.size:desc
     ```

   - Look for indices with `status: read_only` or `status: read_only_allow_delete`.

2. **Clear cluster-level read-only blocks:**

   - In Dev Tools, run:

     ```json
     PUT _cluster/settings
     {
       "persistent": {
         "cluster.blocks.read_only": false,
         "cluster.blocks.read_only_allow_delete": false
       }
     }
     ```

3. **Clear index-level read-only blocks:**

   - In Dev Tools, run:

     ```json
     PUT {index-name}/_settings
     {
       "index.blocks.read_only": false,
       "index.blocks.read_only_allow_delete": false
     }
     ```

   - Replace `{index-name}` with the actual index name.

4. **Check current disk watermark values:**

   - In Dev Tools, run:

     ```http
     GET _cluster/settings?include_defaults=true
     ```

   - Look for `cluster.routing.allocation.disk.watermark.*` settings in the response.

5. **Temporarily increase disk watermarks to prevent re-blocking:**

   - In Dev Tools, run:

     ```json
     PUT _cluster/settings
     {
       "persistent": {
         "cluster.routing.allocation.disk.watermark.low": "90%",
         "cluster.routing.allocation.disk.watermark.high": "95%",
         "cluster.routing.allocation.disk.watermark.flood_stage": "98%"
       }
     }
     ```

6. **Verify write access:**

   - In Dev Tools, run:

     ```http
     GET {index-name}/_settings?include_defaults=true
     ```

7. **Retry manual rollover:**

   - In Dev Tools, run:

     ```http
     POST {index-name}/_rollover
     ```

   - Or use the Dashboard UI as described above.

8. **Reset disk watermarks to defaults after resolving disk space issues:**

   - In Dev Tools, run:

     ```json
     PUT _cluster/settings
     {
       "persistent": {
         "cluster.routing.allocation.disk.watermark.low": null,
         "cluster.routing.allocation.disk.watermark.high": null,
         "cluster.routing.allocation.disk.watermark.flood_stage": null
       }
     }
     ```
