---
title: "Falco: OpenSearch config modified at runtime"
description: "Alert: FalcoOpenSearchConfigWrite"
weight: 102
---

**Alert:** `FalcoOpenSearchConfigWrite`

## Problem

Falco rule `OpenSearch Config Write` fired: a non-trusted process wrote or deleted files under `/usr/share/opensearch/config`. Config comes from projected ConfigMap/Secret volumes and must stay read-only at runtime.

## Impact

Security or auth settings (e.g. `opensearch.yml`, `opensearch-security/*.yml`) may have been altered.

## Diagnosis

1. From the Falco event note `fd.name`, `proc.*`, `user.*`.
1. Verify upstream ConfigMap/Secret matches Git.
1. Diff in-pod file hashes against source.

## Resolution Steps

1. Delete the pod to re-project read-only mounts.
1. If the upstream object was mutated, restore from Git.
1. Investigate the originating process; treat as config tampering.
