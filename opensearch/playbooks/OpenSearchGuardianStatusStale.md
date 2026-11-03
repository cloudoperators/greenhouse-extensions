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

Validate Guardian configuration for `plugins.guardian.job_interval`. Log into the Kubernetes cluster and run:
```bash
kubectl -n <namespace> exec -i <opensearch-pod-name> -c opensearch -- cat config/opensearch.yml | grep guardian
```
If you see `plugins.guardian.job_interval` set to a value greater than 5, the alert threshold likely needs to be adjusted to match the configured interval. If the setting is absent, the default interval of 5 minutes should apply.

For more follow playbooks:
[OpenSearchGuardianEmpty](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchGuardianEmpty.md)
[OpenSearchGuardianErrors](https://github.com/cloudoperators/greenhouse-extensions/tree/main/opensearch/playbooks/OpenSearchGuardianErrors.md)

## Verify Resolution

1. In Guardian, click **Refresh** on the **Status** tab.
2. Confirm status is **compliant** and no errors are shown.
3. Check the **History** tab to confirm the error is no longer recurring.

## Contact Support

If errors persist or the root cause is unclear, seek assistance from your operations team.
