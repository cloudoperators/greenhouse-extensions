---
title: OPA Gatekeeper Config
---

Deploys OPA Gatekeeper ConstraintTemplates and Constraints for Kubernetes admission control. Provides a library of universal admission policies that can be enabled and tuned per cluster.

Requires the [OPA Gatekeeper](https://github.com/cloudoperators/greenhouse-extensions/tree/main/gatekeeper) PluginDefinition to be installed on the cluster.

## Policies

| Policy | Description |
|--------|-------------|
| `highCpuRequests` | Flags workloads that request more than `maxCpu` cores in total across containers and initContainers. |
| `unmanagedPods` | Flags Pods that have no `ownerReference` (i.e. not managed by a Deployment, DaemonSet, etc.). |

## Default behavior

All policies default to `enforcementAction: dryrun`. No policy will block admission by default. Change `enforcementAction` to `warn` or `deny` to enforce.

## Adding more policies

The chart is structured so that additional ConstraintTemplate/Constraint pairs can be added incrementally as standalone Helm templates that include the shared Rego libraries from `_helpers.tpl`. Each policy is gated on `policies.<name>.enabled` and exposes its parameters as PluginDefinition options.
