---
title: Logs are Increasing
weight: 20
---

# Root Cause Analysis
This alert indicates that the collectors sent more than 4 times as many logs in the last hour as in the same hour 2h earlier, for at least 30 minutes. Common causes are a noisy application, a logging misconfiguration or a backlog being sent after an outage.

## Solution

### Steps

1. Make note of which cluster has been affected.
2. Find the source of the increase in the backend, e.g. by grouping the last hour of logs in OpenSearch by namespace or container.
3. If a backlog after an outage explains it, the alert clears once the backlog is sent.
4. Otherwise reduce the log volume at the source or exclude it from collection.
