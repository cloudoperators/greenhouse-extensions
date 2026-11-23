---
title: "Falco: OpenSearch shard file modified"
description: "Alert: FalcoOpenSearchDataRenameOrDelete"
weight: 101
---

**Alert:** `FalcoOpenSearchDataRenameOrDelete`

## Problem

Falco rule `OpenSearch Data Rename Or Delete` fired: a non-JVM process renamed, deleted, truncated, chmoded, or chowned a file under `/usr/share/opensearch/data`.

## Impact

Audit history or search data destroyed. Replicas may still hold the data; recoverability depends on replica count.

## Diagnosis

1. From the Falco event note `k8s.pod.name`, `evt.type`, `fd.name`, `proc.*`, `user.*`.
1. Check shard state:
   ```
   GET _cat/shards?v
   GET _cluster/allocation/explain
   ```

## Resolution Steps

1. Terminate unauthorized sessions.
1. If replicas are healthy, delete the pod to force re-allocation.
1. If replicas also affected, restore the index from snapshot.
1. Open a security incident.
