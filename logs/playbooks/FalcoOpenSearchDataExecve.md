---
title: "Falco: execve from OpenSearch data dir"
description: "Alert: FalcoOpenSearchDataExecve"
weight: 103
---

**Alert:** `FalcoOpenSearchDataExecve`

## Problem

Falco rule `OpenSearch Data Execve` fired: a binary was executed from under `/usr/share/opensearch/data`. The server never runs code from the shard store.

## Impact

Dropped-and-executed payload inside the pod — active intrusion.

## Diagnosis

1. From the Falco event note `k8s.pod.name`, `proc.exepath`, `proc.cmdline`, `proc.pname`, `user.*`.
1. Preserve the binary for forensics before any restart:
   ```sh
   kubectl -n <namespace> cp <pod>:<proc.exepath> /tmp/<hash>.bin -c opensearch
   ```

## Resolution Steps

1. Cordon the node, do not delete the pod until forensics are captured.
1. After capture, delete the pod and investigate source (image, exec session, mount).
1. Open a P1 security incident.
