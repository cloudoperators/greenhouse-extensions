---
title: Logs are Decreasing
weight: 20
---

# Root Cause Analysis
This alert indicates that the logs have significantly decreased due to failed OTel pipelines, endpoints that are not available or simply misconfiguration.

## Solution

### Steps

1. Make note of which cluster has been affected.
2. Check the corresponding backend e.g. OpenSearch. That will give you a good overview if and to what extend logs could not be ingested.
3. Open bash, scope to the affected cluster and run `kubectl get pods -n logs`.
4. Search for indicators that would lead to decreasing logs by running (requires [stern](https://github.com/stern/stern)):

    ```bash
    stern logs-collector -c otc-container --max-log-requests 1000 | grep "error"
    ```

5. Typical errors would be for example:
    * `Exporting failed. Rejecting data. Try enabling sending_queue to survive temporary failure`
    * `all pipelines returned error`
6. Make note of the Collector Pod(s) name that is affected e.g. `logs-collector-{suffix}`
7. Delete the affected Pod(s) by running:

    ```bash
    kubectl delete pod logs-collector-{suffix}
    ```

8. Check the logs of the newly created Pod(s) by running:

    ```bash
    kubectl logs logs-collector-{suffix}
    ```

9. Check the corresponding backend e.g. OpenSearch if the problem was solved.
