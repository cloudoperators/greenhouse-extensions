---
title: OpenSearch
---

## OpenSearch Plugin

The **OpenSearch** plugin sets up an OpenSearch environment using the **OpenSearch Operator**, automating deployment, provisioning, management, and orchestration of OpenSearch clusters and dashboards. It functions as the backend for logs gathered by collectors such as OpenTelemetry collectors, enabling storage and visualization of logs for Greenhouse-onboarded Kubernetes clusters.

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

OpenSearch is a distributed search and analytics engine designed for real-time log and event data analysis.
The **OpenSearch Operator** simplifies the management of OpenSearch clusters by providing declarative APIs for configuration and scaling.

### Components included in this Plugin:

- [OpenSearch Operator](https://github.com/opensearch-project/opensearch-k8s-operator)
- OpenSearch Cluster Management
- OpenSearch Dashboards Deployment
- OpenSearch Index Management
- OpenSearch Security Configuration

## Architecture

![OpenSearch Architecture](img/opensearch-arch.png)

The OpenSearch Operator automates the management of OpenSearch clusters within a Kubernetes environment. The architecture consists of:

- **OpenSearchCluster CRD**: Defines the structure and configuration of OpenSearch clusters, including node roles, scaling policies, and version management.
- **OpenSearchDashboards CRD**: Manages OpenSearch Dashboards deployments, ensuring high availability and automatic upgrades.
- **OpenSearchISMPolicy CRD**: Implements index lifecycle management, defining policies for retention, rollover, and deletion.
- **OpenSearchIndexTemplate CRD**: Enables the definition of index mappings, settings, and template structures.
- **Security Configuration via OpenSearchRole and OpenSearchUser**: Manages authentication and authorization for OpenSearch users and roles.

## Note

More configurations will be added over time, and contributions of custom configurations are highly appreciated.
If you discover bugs or want to add functionality to the plugin, feel free to create a pull request.

## Quick Start

This guide provides a quick and straightforward way to use **OpenSearch** as a Greenhouse Plugin on your Kubernetes cluster.

### Prerequisites

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.
- The OpenSearch Operator installed via Helm or Kubernetes manifests.
- An OpenTelemetry or similar log ingestion pipeline configured to send logs to OpenSearch.

### Installation

#### Install via Greenhouse

1. Navigate to the **Greenhouse Dashboard**.
2. Select the **OpenSearch** plugin from the catalog.
3. Specify the target cluster and configuration options.

## Configuration

| Name                                      | Description                                              | Type  | Required |
|-------------------------------------------|----------------------------------------------------------|--------|----------|
| `openSearch.cluster.name`                 | Name of the OpenSearch cluster                          | string | `true`   |
| `openSearch.cluster.version`              | OpenSearch version to deploy                           | string | `true`   |
| `openSearch.cluster.replicas.master`      | Number of master nodes                                 | int    | `false`  |
| `openSearch.cluster.replicas.data`        | Number of data nodes                                   | int    | `false`  |
| `openSearch.cluster.replicas.dashboards`  | Number of OpenSearch Dashboards nodes                 | int    | `false`  |
| `openSearch.security.username`            | Admin username for OpenSearch authentication          | secret | `true`   |
| `openSearch.security.password`            | Admin password for OpenSearch authentication          | secret | `true`   |
| `openSearch.security.roles`               | User role mappings                                    | map    | `false`  |
| `openSearch.index.ismPolicy.enabled`      | Enable index lifecycle management                     | bool   | `false`  |
| `openSearch.index.ismPolicy.policy`       | Custom ISM policy for index management                | map    | `false`  |
| `openSearch.index.template.enabled`       | Enable index templates                               | bool   | `false`  |
| `openSearch.index.template.definition`    | Custom index template definition                     | map    | `false`  |
| `openSearch.monitoring.prometheus.enabled` | Enable Prometheus monitoring                         | bool   | `false`  |
| `openSearch.monitoring.serviceMonitor`    | Deploy a ServiceMonitor for Prometheus integration   | bool   | `false`  |

## Usage

Once deployed, OpenSearch can be accessed via OpenSearch Dashboards.

```sh
kubectl port-forward svc/opensearch-dashboards 5601:5601
```

Visit `http://localhost:5601` in your browser and log in using the configured credentials.

## Conclusion

This guide ensures that OpenSearch is fully integrated into the Greenhouse ecosystem, providing scalable log management and visualization.
Additional custom configurations can be introduced to meet specific operational needs.

For troubleshooting and further details, check out the [OpenSearch documentation](https://opensearch.org/docs/).
