---
title: Trust Manager
---

This Plugin provides [trust-manager](https://github.com/cert-manager/trust-manager) to automate the management and distribution of trust bundles across Kubernetes clusters.

Trust-manager is a Kubernetes operator that distributes trust bundles (CA certificates) to workloads running in your cluster. It works alongside cert-manager and enables you to manage CA trust stores declaratively.

# Configuration

This section highlights configuration of selected Plugin features.  
All available configuration options are described in the *plugindefinition.yaml*.

## Trust Bundle

The plugin creates a `Bundle` resource that distributes trust bundles to selected namespaces. The bundle includes:
- Default CAs from the trust package image
- The cluster's `kube-root-ca.crt` ConfigMap

| Option | Type | Description |
| --- | --- | --- |
| `bundle.name` | string | Name of the Bundle resource to create |
| `namespaces` | map | Namespace selector for the trust bundle target |

### Namespace Selector Example

```yaml
namespaces:
  matchExpressions:
    - key: kubernetes.io/metadata.name
      operator: In
      values:
        - my-namespace-1
        - my-namespace-2
```

## Additional Bundle Sources

Additional CA sources can be included in the trust bundle by enabling and configuring `additional_sources`.

| Option | Type | Description |
| --- | --- | --- |
| `additional_sources.enabled` | bool | Whether to include additional bundle sources |
| `additional_sources.sources` | list | List of additional sources to include |

### Example

```yaml
additional_sources:
  enabled: true
  sources:
    - configMap:
        key: ca.crt
        name: my-custom-ca
```

## Cert Exporter

An optional cert-exporter can be deployed to monitor trust bundle certificates and expose Prometheus metrics.

| Option | Type | Description |
| --- | --- | --- |
| `cert_exporter.enabled` | bool | Whether to deploy the cert-exporter |
| `cert_exporter.namespaces` | list | Namespaces to deploy cert-exporter into |
| `cert_exporter.image.registry` | string | Registry for the cert-exporter image |
| `cert_exporter.image.repository` | string | Repository for the cert-exporter image |
| `cert_exporter.image.tag` | string | Tag for the cert-exporter image |

## Trust Manager Configuration

| Option | Type | Description |
| --- | --- | --- |
| `trust-manager.app.trust.namespace` | string | Namespace where trust bundles are managed |
| `trust-manager.resources.limits.cpu` | string | CPU limit for trust-manager |
| `trust-manager.resources.limits.memory` | string | Memory limit for trust-manager |
| `trust-manager.resources.requests.cpu` | string | CPU request for trust-manager |
| `trust-manager.resources.requests.memory` | string | Memory request for trust-manager |
| `trust-manager.defaultPackageImage.registry` | string | Registry for the default trust package image |
| `trust-manager.defaultPackageImage.repository` | string | Repository for the default trust package image |

