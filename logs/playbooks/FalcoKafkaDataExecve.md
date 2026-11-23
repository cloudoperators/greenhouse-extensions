---
title: "Falco: execve from Kafka data dir"
description: "Alert: FalcoKafkaDataExecve"
weight: 103
---

**Alert:** `FalcoKafkaDataExecve`

## Problem

Falco rule `Kafka Data Execve` fired: a binary was executed from under `/var/lib/kafka/data-*`. The broker never runs code from the log store.

## Impact

Dropped-and-executed payload inside the broker — active intrusion.

## Diagnosis

1. From the Falco event note `k8s.pod.name`, `proc.exepath`, `proc.cmdline`, `proc.pname`, `user.*`.
1. Preserve the binary:
   ```sh
   kubectl -n <namespace> cp <pod>:<proc.exepath> /tmp/<hash>.bin -c kafka
   ```

## Resolution Steps

1. Cordon the node, capture forensics before restart.
1. Delete the pod after capture.
1. Open a P1 security incident.
