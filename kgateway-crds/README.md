<!--
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# kgateway-crds

Installs the Custom Resource Definitions (CRDs) required by the [kgateway](https://kgateway.dev/) controller.

## Prerequisites

1. `k8s-gateway-api` plugin (Kubernetes Gateway API CRDs)

## Installation order

```
k8s-gateway-api  →  kgateway-crds  →  kgateway
```

## Links

- [kgateway documentation](https://kgateway.dev/docs/envoy/latest/)
- [Install guide](https://kgateway.dev/docs/envoy/latest/install/helm/)
