---
title: OpenSearchGuardianEmpty
weight: 20
---

# OpenSearchGuardianEmpty

## Problem

The OpenSearch Guardian plugin could not determine the compliance status — the status is empty/unknown.

## Impact

- Cluster compliance state is unknown.

## Diagnosis

**Step 1 — Check Guardian in OpenSearch Dashboards:**

1. In the Greenhouse UI, go to **Organization** in the left menu, then **Plugins** > **opensearch \<cluster\>**.
2. Under **External Links**, click on **opensearch-dashboards-external**. Log in if prompted.
3. In the left side menu, find and click **Guardian**.
4. On the **Status** tab, click **Refresh**. Note whether status is empty or shows an error.
5. Check the **History** tab to see when the status last changed and if Guardian was previously working.
6. Check the **Configuration** tab to confirm Guardian is configured correctly.

**Step 2 — Check OpenSearch pod logs:**

Log in to the target k8s cluster and inspect logs for Guardian-related errors:

```bash
kubectl -n fortlogs-audit logs -l ccloud/service=opensearch | grep -i guardian
```

Look for errors related to index mapping, status initialization, or datastream rollover failures.

## Resolution Steps

### 1. Cluster in RED state

If logs or the dashboard show cluster health is RED, Guardian cannot write its status. Fix the cluster first.

See playbook: [OpenSearchClusterRed](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchClusterRed.md)

### 2. Guardian index mapping conflict

Guardian fails to update `.guardian-status` index due to mapping incompatibility. Symptoms in logs: mapping update errors or document rejection errors for `.guardian-status`.

1. Delete the `.guardian-status` index via Dev Tools:

   ```http
   DELETE /.guardian-status
   ```

2. Restart one of the OpenSearch pods to trigger Guardian re-initialization:

   ```bash
   kubectl -n fortlogs-audit delete pod <opensearch-pod-name>
   ```

3. After pod restarts, go to Guardian in the dashboard and click **Refresh** — status should populate.

### 3. Guardian status history datastream needs rollover

If the `guardian-status-history` datastream is stale or causing write failures, trigger a rollover via Dev Tools:

```http
POST /guardian-status-history/_rollover
```

## Verify Resolution

1. In Guardian, click **Refresh** on the **Status** tab.
2. Confirm status is no longer empty — it should show either **compliant** or **noncompliant**.
3. If **noncompliant**, follow the [OpenSearchGuardianNoncompliant](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchGuardianNoncompliant.md) playbook.

## Contact Support

If status remains empty after these steps, seek assistance from your operations team.
