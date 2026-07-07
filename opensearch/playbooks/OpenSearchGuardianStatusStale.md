---
title: OpenSearchGuardianStatusStale
weight: 20
---

# OpenSearchGuardianStatusStale

## Problem

The OpenSearch Guardian plugin could not refresh the status. Status should be refreshed every 5 min.

## Impact

- Current cluster compliance state is unknown.
- Cluster might not fulfill all compliance requirements.

## Diagnosis

Validate Guardian Configuration of `plugins.guardian.job_interval`. Log into k8s cluster and run:
```bash
kubectl exec -it opensearch-audit-manager-2 -c opensearch -- cat config/opensearch.yml | grep guardian
```
If you will see  `plugins.guardian.job_interval` that shows value which is greater than 5 then it looks like the alert is not configured properly for the guardian interval. If no setting at all - then the default of 5 should be enforced.

For more follow playbooks:
[OpenSearchGuardianEmpty](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchGuardianEmpty.md)
[OpenSearchGuardianErrors](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchGuardianErrors.md)

## Verify Resolution

1. In Guardian, click **Refresh** on the **Status** tab.
2. Confirm status is **compliant** and no errors are shown.
3. Check the **History** tab to confirm the error is no longer recurring.

## Contact Support

If errors persist or the root cause is unclear, seek assistance from your operations team.
