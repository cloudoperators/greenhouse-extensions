---
title: OPA Gatekeeper Config
---

Deploys OPA Gatekeeper ConstraintTemplates and Constraints for Kubernetes admission control. Provides a library of universal admission policies that can be enabled and tuned per cluster.

Requires the [OPA Gatekeeper](https://github.com/cloudoperators/greenhouse-extensions/tree/main/gatekeeper) PluginDefinition to be installed on the cluster.

## Policies

| Policy | Description |
|--------|-------------|
| `deprecatedApiVersion` | Detects Helm release Secrets that contain manifests using deprecated Kubernetes API versions. Requires `helmManifestParserURL`. |
| `forbiddenClusterwideObjects` | Enforces a configurable allowlist on MutatingWebhookConfiguration and ValidatingWebhookConfiguration objects. |
| `highCpuRequests` | Flags workloads that request more than `maxCpu` cores in total across containers and initContainers. |
| `ingressAnnotationsMigration` | Checks that Ingress objects use both old and new annotation prefixes consistently during an ingress-nginx prefix migration. Disabled by default; enable only if running such a migration. |
| `ingressAnnotations` | Flags Ingress objects using known-dangerous annotation patterns (e.g. insecure snippets disabled due to CVE-2021-25742). |
| `pciForbiddenImages` | Flags workloads using container images that match a configurable list of forbidden regex patterns. |
| `podSecurityV2` | Enforces pod security restrictions (host network/PID, privilege escalation, capabilities, hostPath mounts) with a configurable per-namespace allowlist. |
| `prometheusScrapeAnnotations` | Checks that `prometheus.io/targets` is set correctly on any Pod or Service with `prometheus.io/scrape: "true"`. Requires a Gatekeeper `Config` resource syncing `monitoring.coreos.com/v1` Prometheus objects into the OPA cache; disabled by default. |
| `unmanagedPods` | Flags Pods that have no `ownerReference` (i.e. not managed by a Deployment, DaemonSet, etc.). |
| `imagesFromApprovedRegistries` | Flags containers using images that do not start with one of the configured allowed registry prefixes. |
| `podRequiredLabels` | Flags pods whose template metadata is missing one or more configured required label keys. |
| `oliLabelsRequired` | Enforces Owner Label Injector labels on Helm releases. Requires gatekeeper-doop. |
| `outdatedImageBases` | Flags containers whose base image layers are older than one year. Requires gatekeeper-doop. |
| `vulnerableImages` | Flags containers using images with known vulnerabilities. Requires gatekeeper-doop. |

## Default behavior

All policies default to `enforcementAction: dryrun`. No policy will block admission by default. Change `enforcementAction` to `warn` or `deny` to enforce.

Several policies default to `enabled: false` because they require additional configuration before they can produce useful results. They must be enabled explicitly and the relevant parameters set via Plugin `optionValues`.

## Policies requiring gatekeeper-doop

The following policies require the [gatekeeper-doop](https://github.com/cloudoperators/greenhouse-extensions/tree/main/doop) plugin to be installed and the corresponding service URL configured. They are disabled by default:

- `outdatedImageBases`: set `policies.outdatedImageBases.imageCheckerURL` to the doop-image-checker service URL.
- `vulnerableImages`: set `policies.vulnerableImages.imageCheckerURL` to the doop-image-checker service URL.
- `oliLabelsRequired`: set `policies.oliLabelsRequired.helmManifestParserURL` to the helm-manifest-parser service URL.
- `deprecatedApiVersion`: set `policies.deprecatedApiVersion.helmManifestParserURL` to the helm-manifest-parser service URL.

## Policies requiring a Gatekeeper Config resource

`prometheusScrapeAnnotations` references the OPA inventory (`data.inventory.namespace[_]["monitoring.coreos.com/v1"].Prometheus[_]`). A Gatekeeper `Config` resource syncing the `Prometheus` CRD into the OPA cache must exist in `gatekeeper-system` before this policy is enabled.
