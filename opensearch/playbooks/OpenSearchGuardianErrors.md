---
title: OpenSearchGuardianErrors
weight: 20
---

# OpenSearchGuardianErrors

## Problem

The OpenSearch Guardian plugin reported errors. The real compliance state of the cluster is unknown.

## Impact

- Ingestion to guarded datastreams may be blocked.
- Compliance status cannot be trusted until errors are resolved.

## Diagnosis

**Step 1 — Check Guardian in OpenSearch Dashboards:**

1. In the Greenhouse UI, go to **Organization** in the left menu, then **Plugins** > **opensearch \<cluster\>**.
2. Under **External Links**, click on **opensearch-dashboards-external**. Log in if prompted.
3. In the left side menu, find and click **Guardian**.
4. On the **Status** tab, click **Refresh**. Note any errors shown.
5. Check the **History** tab — if status recently changed to compliant, Guardian may have self-healed. Verify the timeline matches the alert.
6. Check the **Configuration** tab to confirm Guardian configuration looks correct.

**Step 2 — Check OpenSearch pod logs:**

Log in to the target k8s cluster and look for Guardian errors:

```bash
kubectl -n fortlogs-audit logs -l ccloud/service=opensearch | grep -i guardian
```

## Resolution Steps

The **Status** tab should indicate what error is present. Follow the relevant playbook based on what you find:

- **Status is noncompliant** → follow [OpenSearchGuardianNoncompliant](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchGuardianNoncompliant.md)
- **Status is empty** → follow [OpenSearchGuardianEmpty](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchGuardianEmpty.md)
- **Status shows errors** → Verify Cluster is not in RED status. Verify if history checks are being triggered. Look in the pods logs for errors. Delete `.guardian-status` index if there is a problem with saving the current status. Rollover `guardian-status-history` if history docs cannot be saved. 
- **Status is compliant and History shows recent self-heal** → no action needed, monitor for recurrence

## Verify Resolution

1. In Guardian, click **Refresh** on the **Status** tab.
2. Confirm status is **compliant** and no errors are shown.
3. Check the **History** tab to confirm the error is no longer recurring.

## Contact Support

If errors persist or the root cause is unclear, seek assistance from your operations team.
