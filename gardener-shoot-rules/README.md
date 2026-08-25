---
title: Gardener Shoot Alert Rules
---

The **gardener-shoot-rules** plugin packages Gardener upstream shoot control plane alert rules for evaluation by `prometheus-metrics-gardener`.

## Problem

Gardenlet deploys PrometheusRules in shoot namespaces with the label `prometheus: shoot`. The `prometheus-metrics-gardener` instance uses `ruleSelector: NotIn [shoot]` to avoid 14× duplicate alerts from all shoot namespaces. A side effect is that shoot control plane alerts (`KubeEtcdMainDown`, `KubePodNotReadyControlPlane`, `KubeApiserverDown`, etc.) never fire on the central alertmanager.

## Solution

This plugin installs the same 54 shoot alert rules as a new `PrometheusRule` resource **without** the `prometheus: shoot` label. `prometheus-metrics-gardener` picks it up naturally, evaluates rules once against federated metrics, and routes alerts to alertmanager with the correct labels via `additionalRuleLabels`.

## Options

| Name | Type | Default | Description |
|---|---|---|---|
| `rules.create` | bool | `true` | Deploy the PrometheusRule resource |
| `rules.additionalRuleLabels` | map | `{}` | Extra labels injected into every alert rule (e.g. `thanos-ruler`, `support_group`). Note: keys that overlap with built-in rule labels (`service`, `severity`, `type`, `visibility`) will override those upstream values. |
| `global.commonLabels` | map | `{}` | Labels added to the PrometheusRule metadata |

## Upgrading

Rules are extracted from [gardener/gardener](https://github.com/gardener/gardener) source files. A Renovate comment in `Chart.yaml` tracks the upstream version. To regenerate after a Gardener upgrade:

```bash
# Example: upgrading from v1.148.3 to v1.150.0
make generate GARDENER_VERSION=v1.150.0
git diff charts/templates/prometheusrule-shoot.yaml
```

Requires Go ≥ 1.21 and a GitHub token (`gh auth token` or `GITHUB_TOKEN` env var).
