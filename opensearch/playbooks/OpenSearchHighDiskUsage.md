---
title: OpenSearchHighDiskUsage
weight: 20
---

# OpenSearchHighDiskUsage

## Problem

The OpenSearch cluster is experiencing high disk usage, with 60% of all data nodes being more than 80% full. This can lead to cluster instability and potential data loss.

## Impact

- Cluster performance degradation
- Potential cluster failure if disk usage reaches 90% (hard stop)
- Risk of data loss and service unavailability
- Reduced ability to ingest new data

## Diagnosis

1. **Check for related alerts**: Look for other alerts for the cluster such as `OpensearchClusterYellow`. Resolve these first as they point to problems with opensearch-hermes/logs(-data) nodes.

2. **Verify all data nodes are up**: Check if all data nodes in the cluster are running:

   ```bash
   kubectl get sts opensearch-data -n opensearch-logs
   ```

3. **Check node availability**: If not all nodes are READY in the Kubernetes cluster, check the number of data nodes with the setting in the secrets (opensearch-logs.yaml/opensearch-hermes.yaml) for the data nodes: replicas (8 replicas means 0-7 data nodes have to be available).

4. **Check for missing data nodes**: If there are data nodes missing, check the kubernetes events in the elk namespace:

   ```bash
   kubectl get events -n opensearch-logs|grep data
   ```

   Most of the time there is a volume attachment error based on a problem on the underlying technology stack openstack/vmware and/or #team_services.

5. **Monitor disk usage**: You can find the disk usage dashboard in **Perses** under the **default** project and the **OpenSearch Monitoring** dashboard. In the Greenhouse UI, go to **Organization** > **Plugins** > **perses <cluster>**, then under **External Links** look for **perses**.

## Resolution Steps

1. **Wait for volume issues to resolve**: If there are volume attachment errors, investigate and resolve the underlying infrastructure issues. Once all data nodes are back, wait for the resync to finish.

2. **Check disk usage**: Check the disk usage using the OpenSearch Dev Tools and inspect the datastream and its backing indices.

   - **How to access Dev Tools:**
     1. In the Greenhouse UI, go to **Organization** > **Plugins** > **opensearch <cluster>**.
     2. Under **External Links**, click on **opensearch-dashboards-external** to open OpenSearch Dashboards.
     3. Log in if prompted.
     4. In the OpenSearch Dashboards menu (left side), scroll down to **Management** and then click on **Dev Tools**.

   - In the Dev Tools console, run:

     ```http
     GET _cat/allocation?v
     ```

     To see all backing indices for a datastream:

     ```http
     GET _cat/indices/logs-datastream*
     ```

3. **Relocate shards**: To relocate shards to a node with more available disk space, use the Dev Tools to run the appropriate allocation command for each shard.

4. **Delete index**: Deleting is done via the OpenSearch Dev Tools:

   ```http
   DELETE /<index-name>
   ```

   Replace `<index-name>` with the actual name of the index.

5. **Add more data nodes**: Check if there are enough Kubernetes nodes in the pool where the OpenSearch cluster is deployed:

   ```bash
   kubectl get pods -n opensearch-logs -o wide|grep data |wc -l
   kubectl get nodes|grep payload|wc -l
   ```

   If the second value is higher than the first one + 2 nodes in spare, increase the number of replicas:

   ```bash
   kubectl scale statefulset/opensearch-data --replicas=<new value> -n opensearch-logs
   ```

   Before doing this, check if there is enough volume quota, as each new data node increases the volume capacity.

6. **Monitor rebalancing**: If you can see via the OpenSearch Dev Tools that the cluster is rebalancing, wait and see if the alert clears itself.

**Contact**: If there are any questions, investigate further or seek assistance from your operations team.
