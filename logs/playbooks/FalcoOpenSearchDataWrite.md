---
title: "Falco: OpenSearch data dir written"
description: "Alert: FalcoOpenSearchDataWrite"
weight: 100
---

**Alert:** `FalcoOpenSearchDataWrite`

## Problem

Falco rule `OpenSearch Data Write` fired: a non-JVM process wrote under `/usr/share/opensearch/data` in a OpenSearch data pod.

## Impact

Shard files may be corrupted, injected, or staged for exfiltration (PCI-DSS 10.3).

## Diagnosis

1. From the Falco event capture `k8s.pod.name`, `k8s.ns.name`, `proc.name`, `proc.exepath`, `proc.cmdline`, `user.name`.
1. Verify no legitimate exec session was running:
   ```sh
   kubectl -n <namespace> describe pod <pod>
   kubectl get events -n <namespace> --sort-by=.lastTimestamp | tail
   ```
1. Check cluster health:
   ```
   GET _cluster/health
   GET _cat/shards?v
   ```

## Resolution Steps

1. Terminate unauthorized exec sessions.
1. If shards show corruption, delete the pod — operator will re-sync from replicas.
1. Open a security incident if no legitimate cause is found.
