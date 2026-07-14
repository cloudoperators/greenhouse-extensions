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
| `forbiddenClusterwideObjects` | Restricts which `MutatingWebhookConfiguration` and `ValidatingWebhookConfiguration` objects may exist on the cluster via an allowlist of webhook names. |
| `imagesFromApprovedRegistries` | Enforces that container images come from one of the configured `allowedRegistries` prefixes. |
| `pciForbiddenImages` | Flags container images whose repository matches any of the configured forbidden regex `patterns`. |
| `podRequiredLabels` | Enforces that Pods carry the configured `requiredLabels` keys. |
| `podSecurityV2` | Forbids privileged Pod features (`hostNetwork`, `hostPID`, `privileged`, `allowPrivilegeEscalation`, added capabilities, `hostPath` mounts) unless the Pod matches an entry in `allowlist`. |
| `ingressAnnotations` | Flags Ingresses using insecure nginx snippet annotations or the deprecated `ingress.kubernetes.io/` prefix. |
| `ingressAnnotationsMigration` | During the nginx annotation prefix migration, flags Ingresses that set only one of the old/new prefix or set both with mismatched values. |
| `prometheusScrapeAnnotations` | Flags Pods and Services that opt into scraping via `prometheus.io/scrape: "true"` but are not matched by any configured Prometheus CR. |
| `deprecatedApiVersion` | Flags Helm releases that declare resources using API versions removed in a specific Kubernetes release. Requires `gatekeeper-doop`. |
| `oliLabelsRequired` | Flags Helm release Secrets without the `greenhouse.sap/owned-by` label injected by Owner Label Injector. Requires `gatekeeper-doop`. |
| `outdatedImageBases` | Flags workloads whose container base images are older than `maxAgeDays`, as reported by `doop-image-checker`. Requires `gatekeeper-doop`. |
| `vulnerableImages` | Flags workloads running container images with known vulnerabilities, as reported by `doop-image-checker`. Requires `gatekeeper-doop`. |

## Default behavior

All policies default to `enforcementAction: dryrun`. No policy will block admission by default. Change `enforcementAction` to `warn` or `deny` to enforce.

## Adding more policies

The chart is structured so that additional ConstraintTemplate/Constraint pairs can be added incrementally as standalone Helm templates that include the shared Rego libraries from `_helpers.tpl`. Each policy is gated on `policies.<name>.enabled` and exposes its parameters as PluginDefinition options.

## Running tests

Policy logic is unit-tested with [gator](https://open-policy-agent.github.io/gatekeeper/website/docs/gator) so that ConstraintTemplate Rego can be tested without a Kubernetes cluster.

To run the suite locally:

```sh
# install gator and pin to the same version as the gatekeeper operator chart
GATOR_VERSION=v3.22.2
curl -sL "https://github.com/open-policy-agent/gatekeeper/releases/download/${GATOR_VERSION}/gator-${GATOR_VERSION}-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/amd64/').tar.gz" \
  | sudo tar xz -C /usr/local/bin gator

# render the chart with test values and run gator
./tests/run.sh
```

Adding a policy means adding a fixture directory under `tests/fixtures/<policy>/` and a section in `tests/suite.yaml`.
