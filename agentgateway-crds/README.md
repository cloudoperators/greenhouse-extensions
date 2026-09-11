<!--
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# agentgateway-crds

Installs the Custom Resource Definitions (CRDs) required by the [agentgateway](https://agentgateway.dev/) controller:

- `AgentgatewayBackend` — defines MCP, LLM, agent, and static backends
- `AgentgatewayPolicy` — configures JWT authentication, authorization, CORS, and traffic policies
- `AgentgatewayParameters` — GatewayClass provisioning parameters
- `AgentgatewayModel` — AI model routing (experimental)

## Prerequisites

- Kubernetes Gateway API CRDs must be installed first (`k8s-gateway-api` plugin)

## Usage

Install this plugin before the `agentgateway` plugin. It has no configurable options.

## Links

- [agentgateway documentation](https://agentgateway.dev/docs/)
- [agentgateway GitHub](https://github.com/agentgateway/agentgateway)
