<!--
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# kgateway

Deploys the [kgateway](https://kgateway.dev/) control plane — a Kubernetes-native API gateway built on Envoy and the Gateway API. Originally created by Solo.io as Gloo.

## Features

- **Gateway API native** — full support for HTTPRoute, TCPRoute, and other Gateway API resources
- **Envoy-based** — high-performance data plane powered by Envoy proxy
- **AI extensions** — built-in support for AI traffic management
- **Advanced traffic management** — retries, timeouts, traffic splitting, and header manipulation

## Prerequisites

1. `k8s-gateway-api` plugin (Kubernetes Gateway API CRDs)
2. `kgateway-crds` plugin (kgateway CRDs)

## Installation order

```
k8s-gateway-api  →  kgateway-crds  →  kgateway
```

## Configuration

| Option | Description | Default |
|---|---|---|
| `image.registry` | Global container image registry. Override with a mirror registry if the cluster cannot reach `cr.kgateway.dev` directly. | `cr.kgateway.dev/kgateway-dev` |
| `controller.replicaCount` | Number of kgateway controller replicas. | `1` |

## Links

- [kgateway documentation](https://kgateway.dev/docs/envoy/latest/)
- [Install guide](https://kgateway.dev/docs/envoy/latest/install/helm/)
