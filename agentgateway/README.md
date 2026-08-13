<!--
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# agentgateway

Deploys the [agentgateway](https://agentgateway.dev/) controller — an AI-native reverse proxy for MCP (Model Context Protocol) and A2A protocols. It runs as a Kubernetes controller using the Kubernetes Gateway API.

## Features

- **MCP federation** — multiplex multiple MCP servers behind a single endpoint via `AgentgatewayBackend`
- **JWT authentication** — validate tokens against any OIDC provider via `AgentgatewayPolicy`
- **Per-tool authorization** — CEL-based rules to control which tools a caller can invoke
- **LLM routing** — proxy LLM requests with guardrails, circuit breakers, and rate limiting
- **OpenTelemetry** — built-in tracing and metrics

## Prerequisites

1. `k8s-gateway-api` plugin (Kubernetes Gateway API CRDs)
2. `agentgateway-crds` plugin (agentgateway CRDs)

## Installation order

```
k8s-gateway-api  →  agentgateway-crds  →  agentgateway
```

## Configuration

| Option | Description | Default |
|---|---|---|
| `image.registry` | Container image registry. Override if the cluster cannot reach `cr.agentgateway.dev` (e.g. use a Keppel mirror). | `cr.agentgateway.dev` |
| `image.tag` | Image tag. Uses chart `appVersion` when empty. | `""` |
| `controller.replicaCount` | Number of controller replicas. | `1` |

## Links

- [agentgateway documentation](https://agentgateway.dev/docs/)
- [Install guide](https://agentgateway.dev/docs/kubernetes/latest/install/helm/)
- [agentgateway GitHub](https://github.com/agentgateway/agentgateway)
