---
title: OPA Gatekeeper
---

This Plugin provides [OPA Gatekeeper](https://open-policy-agent.github.io/gatekeeper/), a policy controller for Kubernetes based on the [Open Policy Agent](https://www.openpolicyagent.org/) constraint framework.

## Constraints

Only the operator is deployed. No `ConstraintTemplate` or `Constraint` resources are bundled.

Constraints can be applied separately, or installed via the `gatekeeper-config` PluginDefinition (planned).

## Enforcement

Enforcement mode is set per Constraint via `spec.enforcementAction`. Valid values: `dryrun` (log only), `warn` (return warning), `deny` (block).

## Configuration

See *plugindefinition.yaml* for available options.

## Webhook scoping

By default the validating webhook intercepts all API groups (`*`). On specialized cluster types (Gardener shoots, compute, storage) this is too broad and can interfere with node join or maintenance.

The plugin exposes `validatingWebhookCustomRules`, `validatingWebhookObjectSelector`, and `validatingWebhookExemptNamespacesLabels` to scope the webhook. Apply them per cluster type via a `PluginPreset`.

The chart registers a second webhook, `check-ignore-label.gatekeeper.sh`, that guards the `admission.gatekeeper.sh/ignore` namespace label. Its failure policy is `validatingWebhookCheckIgnoreFailurePolicy` (default `Ignore` here, vs upstream's `Fail`) so Gardener maintenance is not blocked when the webhook server is briefly unavailable. Both webhooks share `validatingWebhookTimeoutSeconds` (default `3`).

### Example: Gardener shoot

```yaml
optionValues:
  - name: validatingWebhookCustomRules
    value:
      - apiGroups: ["apps"]
        apiVersions: ["*"]
        operations: [CREATE, UPDATE]
        resources: [deployments, daemonsets, statefulsets, replicasets]
      - apiGroups: [""]
        apiVersions: ["*"]
        operations: [CREATE, UPDATE]
        resources: [pods]
      - apiGroups: ["batch"]
        apiVersions: ["*"]
        operations: [CREATE, UPDATE]
        resources: [jobs, cronjobs]
  - name: validatingWebhookObjectSelector
    value:
      matchExpressions:
        - key: gardener.cloud/purpose
          operator: NotIn
          values: [kube-system]
        - key: kubernetes.io/metadata.name
          operator: NotIn
          values: [kube-system]
        - key: shoot.gardener.cloud/no-cleanup
          operator: NotIn
          values: ["true"]
  - name: validatingWebhookExemptNamespacesLabels
    value:
      kubernetes.io/metadata.name:
        - kube-system
        - kube-public
        - kube-node-lease
        - default
```

References: [Gardener shoot constraints](https://github.com/gardener/gardener/blob/master/docs/usage/shoot/shoot_status.md#constraints).
