---
title: "Falco: mount syscall inside collector"
description: "Alert: FalcoOTelPodMountSyscall"
weight: 105
---

**Alert:** `FalcoOTelPodMountSyscall`

## Problem

Falco rule `OpenTelemetry Pod Mount Syscall` fired: a `mount`, `umount`, or `umount2` syscall was executed inside a logs or audit-logs collector pod. Collectors do not mount filesystems at runtime.

## Impact

Strong indicator of volume remount tampering (bypassing readOnly) or a container-escape primitive.

## Diagnosis

1. From the Falco event capture `k8s.pod.name`, `container.name`, `evt.type`, `proc.name`, `proc.cmdline`, `user.name`.
1. Check pod security context and recent `kubectl exec` audit entries.

## Resolution Steps

1. Delete the pod immediately.
1. If repeated: cordon the node, isolate for forensics.
1. Review RBAC — restrict `pods/exec` on the namespace.
