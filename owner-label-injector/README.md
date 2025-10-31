<!--
SPDX-FileCopyrightText: 2025 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# Owner Label Injector

## Overview

The **Owner Label Injector** is a Kubernetes mutating admission webhook that automatically ensures every relevant resource in your cluster carries standardized owner labels. These labels enable:

- **Incident Routing** - Direct alerts to the right team
- **Cost Allocation** - Track resource ownership for chargeback
- **SLO Roll-ups** - Aggregate service-level objectives by owner
- **Cleanup Automation** - Identify orphaned resources

## Labels Injected

The webhook automatically adds these labels to resources:

- `ccloud/support-group` - The team responsible for the resource
- `ccloud/service` - The service the resource belongs to (optional)

Both the prefix (`ccloud`) and suffixes can be customized via plugin configuration.

## How It Works

The webhook determines ownership using this precedence:

1. **Existing Labels** - If both owner labels are already present and valid, no changes are made
2. **Helm Release Metadata** - For Helm-managed resources, looks up owner info in ConfigMaps:
   - `owner-of-<release>` in the release namespace (primary)
   - `early-owner-of-<release>` (fallback for bootstrapping)
3. **Static Rules** - Regex-based mapping from Helm release name/namespace to owners
4. **Owner Traversal** - Follows `ownerReferences` upward until owner data is found

### Special Cases

The injector handles these edge cases intelligently:

- `vice-president/claimed-by-ingress` annotation → treats that Ingress as the owner
- `VerticalPodAutoscalerCheckpoint` → follows `spec.vpaObjectName`
- PVCs from StatefulSet `volumeClaimTemplates` → derives StatefulSet owner
- Pod templates in Deployments/StatefulSets/DaemonSets/Jobs/CronJobs → labels propagated

## Components

This plugin deploys:

- **Mutating Webhook** - Intercepts resource creation/updates to inject labels
- **Manager** - Webhook server with health/metrics endpoints
- **CronJob (optional)** - Periodic labeller to backfill existing resources
- **ServiceMonitor (optional)** - Prometheus metrics integration

## Configuration

### Key Options

| Option | Description | Default |
|--------|-------------|---------|
| `replicaCount` | Number of webhook replicas for HA | `3` |
| `config.labels.prefix` | Prefix for injected labels | `ccloud` |
| `config.labels.supportGroupSuffix` | Suffix for support group label | `support-group` |
| `config.labels.serviceSuffix` | Suffix for service label | `service` |
| `config.helm.ownerConfigMapPrefix` | Prefix for owner ConfigMaps | `owner-of-` |
| `config.staticRules` | YAML object with rules for Helm→owner mapping | `{}` |
| `cronjob.enabled` | Enable periodic reconciliation via CronJob | `false` |

### Static Rules Example

Configure regex-based rules when owner ConfigMaps don't exist:

```yaml
config:
  staticRules:
    rules:
      - helmReleaseName: ".*"
        helmReleaseNamespace: "kube-system"
        supportGroup: "platform"
        service: "kubernetes"
      - helmReleaseName: "prometheus-.*"
        helmReleaseNamespace: ".*"
        supportGroup: "observability"
```

## Resource Requirements

Default resource allocation per replica:

- **CPU**: 400m request, 800m limit
- **Memory**: 4000Mi request, 8000Mi limit

Adjust via `resources.*` options for your cluster size.

## Integration with Helm Charts

For applications deployed via Helm, pair them with the `common/owner-info` helper chart to publish owner ConfigMaps that the injector consumes:

```yaml
# In your Helm chart's dependencies
dependencies:
  - name: owner-info
    repository: oci://ghcr.io/cloudoperators/greenhouse-extensions/charts
    version: 1.0.0
```

This creates `owner-of-<release>` ConfigMaps automatically.

## Monitoring

When `prometheus.enabled: true`, the plugin exposes:

- `/metrics` - Prometheus metrics on port 8080
- `/healthz` - Health probe on port 8081
- `/readyz` - Readiness probe on port 8081

## Security

- **Failure Policy**: `Ignore` - API requests succeed even if webhook is down
- **RBAC**: Minimal permissions (get/list/patch resources, get ConfigMaps)
- **Security Context**: Drops all capabilities, non-root user

## Links

- **Source Code**: [github.com/cloudoperators/owner-label-injector](https://github.com/cloudoperators/owner-label-injector)
- **Documentation**: [README.md](https://github.com/cloudoperators/owner-label-injector/blob/main/README.md)
- **Helm Chart**: [system/owner-label-injector](https://github.com/sapcc/helm-charts/tree/master/system/owner-label-injector)

## Support

For issues, feature requests, or questions, please visit:
- [GitHub Issues](https://github.com/cloudoperators/owner-label-injector/issues)
