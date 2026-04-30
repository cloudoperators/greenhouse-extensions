---
title: OPA Gatekeeper
---

This Plugin provides [OPA Gatekeeper](https://open-policy-agent.github.io/gatekeeper/), a policy controller for Kubernetes based on the [Open Policy Agent](https://www.openpolicyagent.org/) constraint framework.

# Constraints

Only the operator is deployed. No `ConstraintTemplate` or `Constraint` resources are bundled.

Constraints can be applied separately, or installed via the `gatekeeper-config` PluginDefinition (planned).

# Enforcement

Enforcement mode is set per Constraint via `spec.enforcementAction`. Valid values: `dryrun` (log only), `warn` (return warning), `deny` (block).

# Configuration

See *plugindefinition.yaml* for available options.
