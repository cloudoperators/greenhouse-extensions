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
   kubectl get sts opensearch-logs-data -n opensearch-logs
   ```
   (OpenSearch-logs cluster runs on scaleout s-<region>)

3. **Check node availability**: If not all nodes are READY in the Kubernetes cluster or not all show up in the manager `https://opensearch-logs-manager.scaleout.<region>.cloud.sap/`, check the number of data nodes with the setting in the secrets (opensearch-logs.yaml/opensearch-hermes.yaml) for the data nodes: replicas (8 replicas means 0-7 data nodes have to be available).

4. **Check for missing data nodes**: If there are data nodes missing, check the kubernetes events in the elk namespace:
   ```bash
   kubectl get events -n opensearch-logs|grep data
   ```
   Most of the time there is a volume attachment error based on a problem on the underlying technology stack openstack/vmware and/or #team_services.

5. **Monitor disk usage**: Check `https://plutono.<region>.cloud.sap/d/health-opensearch/health-opensearch?viewPanel=97&orgId=1&refresh=1m&var-datasource=prometheus-infra-scaleout&var-cluster=<cluster>` for sudden surge in disk usage.

## Resolution Steps

1. **Wait for volume issues to resolve**: If there are volume attachment errors, investigate and resolve the underlying infrastructure issues. Once all data nodes are back, wait for the resync to finish.

2. **Check disk usage**: Check the disk usage using the OpenSearch Dev Tools and query for the logstash index for the actual day like `logstash-2023.04.16`.

3. **Relocate shards from red disks**: If there are nodes that are not in status `red` and which have more available disk space than the nodes containing the shards for the current day, use the Dev Tools to relocate the respective shards to a node with more available disk space. Do this for all shards which are on red disks and wait for the resync to happen.

4. **Delete oldest indexes**: Quick solution - delete the oldest day of the `logstash-<YYYY-MM-DD>` index until the data nodes have more space. Deleting is done via the OpenSearch Dev Tools.

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

6. **Restart log collectors**: Check if there are more alerts regarding problems with logshipping to this cluster. If yes, restart the respective daemonset:
   ```bash
   kubectl rollout restart daemonset/<logs-collector> -n logs
   ```

7. **Monitor rebalancing**: If you can see via the OpenSearch Dev Tools that the cluster is rebalancing, wait and see if the alert clears itself.

**Contact**: If there are any questions, investigate further or seek assistance from your operations team.
