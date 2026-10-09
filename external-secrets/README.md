---
title: External Secrets
---

This Plugin provides the [External Secrets Operator (ESO)](https://external-secrets.io/) to synchronize secrets from external secret providers (e.g. AWS Secrets Manager, Vault, Azure Key Vault, GCP Secret Manager) into Kubernetes `Secret` resources.

## Configuration

This section highlights configuration of selected Plugin features.
Refer to the [upstream chart documentation](https://github.com/external-secrets/external-secrets/tree/main/deploy/charts/external-secrets) for all available configuration options.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `installCRDs` | bool | `true` | Install and upgrade CRDs through the Helm chart |
| `replicaCount` | int | `1` | Replicas for the controller |
| `serviceMonitor.enabled` | bool | `false` | Create a ServiceMonitor for Prometheus metrics |
| `webhook.certManager.enabled` | bool | `false` | Use cert-manager for the webhook certificate |
