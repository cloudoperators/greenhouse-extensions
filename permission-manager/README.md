<!--
SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
SPDX-License-Identifier: Apache-2.0
-->

# Permission Manager

## Overview

**Permission Manager** is a Kubernetes operator for managing GitHub and Kubernetes permissions as code. It bridges the gap between requestable permissions in your Identity Provider and the actual access provisioned on downstream systems — expressed as Kubernetes CRDs, versioned in Git, and reconciled by controllers.

## What It Does

- **Kubernetes RBAC** — provisions ClusterRoles and RoleBindings on remote clusters via Greenhouse kubeconfigs
- **GitHub team permissions** — creates GithubTeam/GithubTeamRepository resources (consumed by [repo-guard](https://github.com/cloudoperators/repo-guard))
- **Greenhouse team bindings** — creates Team and TeamRoleBinding resources

## Requirements

- **[Greenhouse](https://github.com/cloudoperators/greenhouse)** cluster — provides `Cluster` CRDs and kubeconfig Secrets for remote cluster access
- **[repo-guard](https://github.com/cloudoperators/repo-guard)** — required when the GitHub provider is enabled

## Links

- **Source Code**: [github.com/cloudoperators/permission-manager](https://github.com/cloudoperators/permission-manager)
- **Issues**: [GitHub Issues](https://github.com/cloudoperators/permission-manager/issues)
