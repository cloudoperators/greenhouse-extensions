<!-- SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# OIDC Discovery Access

This plugin grants anonymous access to OIDC discovery endpoints on target clusters by creating a ClusterRoleBinding that binds the `system:anonymous` user to the built-in `system:service-account-issuer-discovery` ClusterRole.

## Purpose

Enables anonymous users to access OIDC discovery endpoints, which is required for certain authentication flows and service account token validation.

## Resources Created

- **ClusterRoleBinding**: `expose-oidc-endpoints`
  - Subject: `system:anonymous` user
  - RoleRef: `system:service-account-issuer-discovery` ClusterRole

## Documentation

For more information about service account issuer discovery, see the [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#service-account-issuer-discovery).