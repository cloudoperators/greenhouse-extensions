---
title: "Falco: OTel persistent queue tampered"
description: "Alert: FalcoOTelQueueRenameOrDelete"
weight: 100
---

**Alert:** `FalcoOTelQueueRenameOrDelete`

## Problem

Falco rule `OpenTelemetry Queue Rename Or Delete` fired: a non-collector process renamed or deleted a file under `/var/lib/otel-queue` inside the audit ingester StatefulSet. The collector rotates its own WAL files; external modifications destroy not-yet-flushed OpenSearch documents.

## Impact

Audit records queued for OpenSearch can be lost before export (PCI-DSS 10.3).

## Diagnosis

1. Pull the Falco events for the cluster:
   ```
   attributes.rule: "OpenTelemetry Queue Rename Or Delete" AND attributes.k8s.cluster.name: "<cluster>"
   ```
1. From the event, note `k8s.pod.name`, `proc.name`, `proc.exepath`, `proc.cmdline`, `user.name`.
1. Check for an active exec session:
   ```sh
   kubectl get events -n <namespace> --sort-by=.lastTimestamp | tail
   kubectl -n <namespace> describe pod <pod>
   ```

## Resolution Steps

1. Terminate any unauthorized exec/debug session on the pod.
1. If a legitimate operator action caused it, document it in the incident log.
1. If not legitimate, treat as tampering: isolate the pod (`kubectl cordon` the node, capture logs, delete the pod to restart from PVC).
1. Confirm no further Falco hits for 10 min.
