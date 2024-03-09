---
title: Cert-manager
---

This Plugin provides the [cert-manager](https://github.com/cert-manager/cert-manager) to automate the management of TLS certificates.

# Configuration

This section highlights configuration of selected Plugin features.  
All available configuration options are described in the *plugin.yaml*.

## Ingress shim

An [Ingress resource](https://kubernetes.io/docs/concepts/services-networking/ingress) in Kubernetes configures external access to services in a Kubernetes cluster.   
Securing ingress resources with TLS certificates is a common use-case and the cert-manager can be configured to handle these via the `ingress-shim` component.  
It can be enabled by deploying an issuer in your organization and setting the following options on this plugin.

| Option | Type   | Description                                                  |
| --- |--------|--------------------------------------------------------------|
| `cert-manager.ingressShim.defaultIssuerName` | string | Name of the cert-manager issuer to use for TLS certificates  |
| `cert-manager.ingressShim.defaultIssuerKind` | string | Kind of the cert-manager issuer to use for TLS certificates  |
| `cert-manager.ingressShim.defaultIssuerGroup` | string | Group of the cert-manager issuer to use for TLS certificates |
