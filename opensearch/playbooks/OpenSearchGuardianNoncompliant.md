---
title: OpenSearchGuardianNoncompliant
weight: 20
---

# OpenSearchGuardianNoncompliant

## Problem

The OpenSearch Guardian plugin detected that the cluster is in a noncompliant state. Guardian enforces compliance criteria including audit log configuration, guarded datastream existence, index template settings, and forbidden permissions/role mappings.

Compliance criteria — all must be satisfied:

- Audit logs are enabled
- All guarded datastreams exist
- Each guarded datastream has an index template with at least 1 `replica` and `index.append_only.enabled: true`
- No forbidden permissions exist
- No forbidden role mappings exist

## Impact

**Ingestion to guarded datastreams is stopped while status is noncompliant.** Logs accumulate inside Kafka. Act quickly — if Kafka buffer fills up, messages will be dropped and lost.

## Diagnosis

1. Open OpenSearch Dashboards:
   1. In the Greenhouse UI, go to **Organization** in the left menu, then **Plugins** > **opensearch \<cluster\>**.
   2. Under **External Links**, click on **opensearch-dashboards-external**.
   3. Log in if prompted.

2. In the left side menu, find and click **Guardian**.

3. On the **Status** tab, click **Refresh** to ensure the status is current. Review all listed violations.

4. Check the **Configuration** tab to see:
   - Which datastreams are guarded
   - Which permissions and role mappings are forbidden

5. Check the **History** tab to see when the status changed — this helps estimate how much log data is buffered in Kafka.

## Resolution Steps

Work through violations shown on the **Status** tab one by one.

### 1. Audit logs not enabled

Enable audit logging via Dev Tools:

```json
PUT _plugins/_security/api/audit/config
{
  "enabled": true
}
```
- Or via UI: on the left side menu: Security > Audit logs (Enable audit logging: Enable)

### 2. Index template missing or misconfigured

Index templates are created from k8s CR (opensearchindextemplates.opensearch.org). If they are missing or are misconfigured most probably the k8s reconciliation is broken. Any changes to live cluster made via UI should be in quick manner overwritten by k8s OpenSearch Operator to match k8s state. To investigate follow below steps:

1. Check configuration on the OpenSearch cluster. On OpenSearch Dashboard go to left side menu and go to IndexManagement > Templates. Look for: `audit-kafka-index-template`, `hermes-kafka-index-template`, `syslog-audit-kafka-index-template`. Confirm their configuration: look at `replicas` and `append_only` setting. If all is correct then look at the priority of the template. See if there is any index template with higher priority that matches index pattern.
2. Check configuration on a k8s cluster. Log in to k8s cluster and run:
    ```bash
    kubectl -n fortlogs-audit get opensearchindextemplates.opensearch.org
    ```
    Inspect a specific template (look for `replicas` and `append_only`):
    ```bash
    kubectl -n fortlogs-audit get opensearchindextemplates.opensearch.org audit-kafka-index-template -o yaml
    kubectl -n fortlogs-audit get opensearchindextemplates.opensearch.org hermes-kafka-index-template -o yaml
    kubectl -n fortlogs-audit get opensearchindextemplates.opensearch.org syslog-audit-kafka-index-template -o yaml
    ```
3. Log in into greenhouse cluster to verify plugin and pluginpreset.
    ```bash
    kubectl get plugins | grep opensearch
    kubectl get pluginpreset | grep opensearch
    kubectl get plugin <plugin-name> -o yaml
    kubectl get pluginpreset <pluginpreset-name> -o yaml
    ```
    If the plugin/pluginpreset status is not Ready - and the status of a CR is not helpful need to reach out to the Greenhouse Operation Team.

**WORKAROUND**: Via OpenSearch Dashboard create a new index template as a duplicate of the wrong one - fix the issues and give higher priority. Guardian should pick up the new index template and not complain.

### 3. Guarded datastream does not exist

Create the missing datastream via Dev Tools:

```http
PUT _data_stream/<datastream-name>
```

Replace `<datastream-name>` with the name shown in the Guardian violation.

### 4. Forbidden permissions exist

On OpenSearch Dashboard go to left side menu and go to Security > Permissions. Find the problematic permission and delete. 

### 5. Forbidden role mappings exist

On OpenSearch Dashboard go to left side menu and go to Security > Roles. Find the problematic Role and see to which users it's mapped. Delete problematic mapping.

### 6. Index in guarded datastream is not append_only

This requires index deletion. **Before deleting, assess whether data loss is acceptable:**

- **If data can be lost:** Delete the index directly:

  ```http
  DELETE /<index-name>
  ```

- **If data must be preserved — reindex first:**

  1. Create a temporary index:

     ```json
     PUT <temp-index-name>
     {
       "settings": {
         "number_of_replicas": 1
       }
     }
     ```

  2. Reindex data into the temporary index:

     ```json
     POST _reindex
     {
       "source": { "index": "<index-name>" },
       "dest": { "index": "<temp-index-name>" }
     }
     ```

  3. Verify document count matches:

     ```http
     GET <temp-index-name>/_count
     GET <index-name>/_count
     ```

  4. Delete the original index:

     ```http
     DELETE /<index-name>
     ```

  5. If needed, reindex back into the datastream after compliance is restored.

## Verify Resolution

1. In Guardian, click **Refresh** on the **Status** tab.
2. Confirm status changed to **compliant**.
3. Verify ingestion resumes — check that logs are no longer accumulating in Kafka.
4. Check the **History** tab to confirm the compliance state transition was recorded.

## Contact Support

If violations persist after following these steps, or if you are unsure whether it is safe to delete an index, seek assistance from your operations team before proceeding.
