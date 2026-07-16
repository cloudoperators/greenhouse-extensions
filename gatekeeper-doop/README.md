---
title: Gatekeeper DOOP
---

Per-cluster components of [DOOP](https://github.com/sapcc/gatekeeper-addons) for OPA Gatekeeper. Runs alongside the `gatekeeper` operator on every managed cluster:

- `doop-analyzer` subscribes to Gatekeeper audit reports, deduplicates violations via merging rules, and uploads the aggregate to an OpenStack Swift container that the central `doop-api` plugin then serves.
- `doop-image-checker` is an HTTP service called by Rego policies (via `http.send`) to check container image vulnerability and provenance against a container registry that exposes the required metadata.
- `helm-manifest-parser` is an HTTP service that decodes Helm release Secret blobs into JSON so policies can reason about Helm-managed resources.

Install the `gatekeeper` PluginDefinition first; `gatekeeper-doop` should be installed with `Plugin.spec.waitFor` referencing it. Policies that call `image-check.rego` or `helm-release.rego` require `disabledBuiltins` on the gatekeeper plugin to be set to `[]` so `http.send` is available.
