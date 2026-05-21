---
title: Trust Manager
---

This Plugin provides [trust-manager](https://github.com/cert-manager/trust-manager) to automate the management and distribution of trust bundles across Kubernetes clusters.

Trust-manager is a Kubernetes operator that distributes trust bundles (CA certificates) to workloads running in your cluster. It works alongside cert-manager and enables you to manage CA trust stores declaratively.

## Prerequisites

- **cert-manager** must be installed on the target cluster before deploying this plugin. Trust-manager depends on cert-manager for its webhook certificates. You can install it using the [cert-manager Greenhouse plugin](https://github.com/cloudoperators/greenhouse-extensions/tree/main/cert-manager).

## Configuration

This section highlights configuration of selected Plugin features.
All available configuration options are described in the *plugindefinition.yaml*.

### Trust Bundle

The plugin creates a `Bundle` resource that distributes trust bundles to selected namespaces. The bundle includes:
- Default CAs from the trust package image
- The cluster's `kube-root-ca.crt` ConfigMap

Bundle creation can be disabled by setting `bundle.enabled` to `false`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `bundle.enabled` | bool | `true` | Whether to create the Bundle resource |
| `bundle.name` | string | `trust-bundle` | Name of the Bundle resource to create |
| `namespaces` | map | `{}` | Namespace selector for the trust bundle target |

> **⚠️ Warning:** An empty `namespaces` selector (`{}`) matches **ALL namespaces**, distributing the trust bundle cluster-wide. To restrict distribution, configure a `matchLabels` or `matchExpressions` selector.

#### Namespace Selector Example

```yaml
namespaces:
  matchExpressions:
    - key: kubernetes.io/metadata.name
      operator: In
      values:
        - my-namespace-1
        - my-namespace-2
```

### Additional Bundle Sources

Additional CA sources can be included in the trust bundle by enabling and configuring `additionalSources`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `additionalSources.enabled` | bool | `false` | Whether to include additional bundle sources |
| `additionalSources.sources` | list | `[]` | List of additional sources to include |

#### Example

```yaml
additionalSources:
  enabled: true
  sources:
    - configMap:
        key: ca.crt
        name: my-custom-ca
```

### Cert Exporter

An optional cert-exporter can be deployed to monitor trust bundle certificates and expose Prometheus metrics.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `certExporter.enabled` | bool | `false` | Whether to deploy the cert-exporter |
| `certExporter.namespaces` | list | `[]` | Namespaces to deploy cert-exporter into |
| `certExporter.image.registry` | string | `docker.io` | Registry for the cert-exporter image |
| `certExporter.image.repository` | string | `joeelliott/cert-exporter` | Repository for the cert-exporter image |
| `certExporter.image.tag` | string | `v2.13.0` | Tag for the cert-exporter image |

### Trust Manager Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `trust-manager.app.trust.namespace` | string | `trust-manager` | Namespace where trust bundles are managed |
| `trust-manager.resources.limits.cpu` | string | `200m` | CPU limit for trust-manager |
| `trust-manager.resources.limits.memory` | string | `256Mi` | Memory limit for trust-manager |
| `trust-manager.resources.requests.cpu` | string | `100m` | CPU request for trust-manager |
| `trust-manager.resources.requests.memory` | string | `128Mi` | Memory request for trust-manager |
| `trust-manager.defaultPackageImage.registry` | string | `quay.io` | Registry for the default trust package image |
| `trust-manager.defaultPackageImage.repository` | string | `jetstack/trust-pkg-debian-bookworm` | Repository for the default trust package image |
