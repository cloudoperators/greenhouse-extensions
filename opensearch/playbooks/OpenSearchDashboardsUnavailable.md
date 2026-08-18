---
title: OpenSearchDashboardsUnavailable
weight: 20
---

# OpenSearchDashboardsUnavailable

## Problem

OpenSearch Dashboard (UI) is unavailable which means there is no running pod.

## Impact

- Users cannot access OpenSearch Dashboards, therefore cannot see their logs

## Diagnosis

1. Look into logs of the crashing pods and see if there is migration problem:
```
{"type":"log","@timestamp":"2026-08-12T08:38:40Z","tags":["warning","savedobjects-service"],"pid":1,"message":"Unable to connect to OpenSearch. Error: resource_already_exists_exception: [resource_already_exists_exception] Reason: index [.kibana_4/p7tJbmCRTc2AjoIJiC8YsQ] already exists"}
{"type":"log","@timestamp":"2026-08-12T08:38:40Z","tags":["warning","savedobjects-service"],"pid":1,"message":"Another OpenSearch Dashboards instance appears to be migrating the index. Waiting for that migration to complete. If no other OpenSearch Dashboards instance is attempting migrations, you can get past this message by deleting index .kibana_4 and restarting OpenSearchDashboards."}
```

## Resolution Steps

1. **Migration problem**:
    - Delete problematic index mentioned in the pod's logs (`.kibana_4`). As DevTools is not accessible you need to `curl` command. The credentials for admin user to perform the curl you can find in k8s secret `admin-credentials` or in vault under `/secrets/{{ $region }}/fortlogs/audit/users/{{ $user.name }}/username` and `/secrets/{{ $region }}/fortlogs/audit/users/{{ $user.name }}/password`
    ```
    # e.g. logs-api.fortlogs.eu-de-1.cloud.sap
    curl -X -k DELETE https://logs-api.fortlogs.eu-de-1.cloud.sap/.kibana_4 -u username:password
    ```
    - Delete the opensearch dashboards pod and let the pod recreate `.kibana_4` index.
    ```
    kubectl delete pod opensearch-logs-dashboards-9669f5d95-xzzdk
    ```

2. **Contact support**: If the opensearch dashboard is not getting up after these steps, investigate further or seek assistance from your operations team.
