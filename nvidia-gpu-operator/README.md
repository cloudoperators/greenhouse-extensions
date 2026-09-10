---
title: NVIDIA GPU Operator
---

This Plugin provides the [NVIDIA GPU Operator](https://github.com/NVIDIA/gpu-operator) which automates the management of NVIDIA software components needed to provision GPUs in Kubernetes clusters.

The bundled [node-feature-discovery](https://github.com/kubernetes-sigs/node-feature-discovery) subchart is enabled by default and can be disabled via `nfd.enabled` if NFD is already installed separately.
