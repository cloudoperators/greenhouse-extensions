---
title: Thanos
---

Learn more about the **Thanos** Plugin. Use it to enable extended metrics retention and querying across Prometheus servers and Greenhouse clusters. 

The main terminologies used in this document can be found in [core-concepts](https://cloudoperators.github.io/greenhouse/docs/getting-started/core-concepts).

## Overview

Thanos is a set of components that can be used to extend the storage and retrieval of metrics in Prometheus. It allows you to store metrics in a remote object store and query them across multiple Prometheus servers and Greenhouse clusters. This Plugin is intended to provide a set of pre-configured Thanos components that enable a proven composition. At the core, a set of Thanos components is installed that adds long-term storage capability to a single **kube-monitoring** Plugin and makes both current and historical data available again via one Thanos Query component.

![Thanos Architecture](img/Thanos-setup-example.png)

The **Thanos Sidecar** is a component that is deployed as a container together with a Prometheus instance. This allows Thanos to optionally upload metrics to the object store and Thanos Query to access Prometheus data via a common, efficient StoreAPI.

The **Thanos Compact** component applies the Prometheus 2.0 Storage Engine compaction process to data uploaded to the object store. The Compactor is also responsible for applying the configured retention and downsampling of the data. 

The **Thanos Store** also implements the StoreAPI and serves the historical data from an object store. It acts primarily as an API gateway and has no persistence itself.

**Thanos Query** implements the Prometheus HTTP v1 API for querying data in a Thanos cluster via PromQL. In short, it collects the data needed to evaluate the query from the connected StoreAPIs, evaluates the query and returns the result.

This plugin deploys the following Thanos components:

* [Thanos Query](https://thanos.io/tip/components/query.md/)
* [Thanos Store](https://thanos.io/tip/components/store.md/)
* [Thanos Compactor](https://thanos.io/tip/components/compact.md/)

Planned components:
* [Thanos Ruler](https://thanos.io/tip/components/rule.md/)
* [Thanos Query Frontend](https://thanos.io/tip/components/query.md/)

This Plugin does **not** deploy the following components:
* [Thanos Sidecar](https://thanos.io/tip/components/sidecar.md/)
This component is installed in the [kube-monitoring](https://github.com/cloudoperators/greenhouse-extensions/tree/main/kube-monitoring) plugin.

## Disclaimer 

It is not meant to be a comprehensive package that covers all scenarios. If you are an expert, feel free to configure the Plugin according to your needs.

Contribution is highly appreciated. If you discover bugs or want to add functionality to the plugin, then pull requests are always welcome.

## Quick start

This guide provides a quick and straightforward way to use **Thanos** as a Greenhouse Plugin on your Kubernetes cluster. The guide is meant to build the following setup.

**Prerequisites**

- A running and Greenhouse-onboarded Kubernetes cluster. If you don't have one, follow the [Cluster onboarding](https://cloudoperators.github.io/greenhouse/docs/user-guides/cluster/onboarding) guide.
- Ready to use credentials for a [compatible object store](https://thanos.io/tip/thanos/storage.md/)
- **kube-monitoring** plugin installed. Thanos Sidecar on the Prometheus must be [enabled](#kube-monitoring-plugin-enablement) by providing the required object store credentials. 

**Step 1:**

Create a Kubernetes Secret with your object store credentials following the [Object Store preparation](#object-store-preparation) section.

**Step 2:**

Enable the Thanos Sidecar on the Prometheus in the **kube-monitoring** plugin by providing the required object store credentials. Follow the [kube-monitoring plugin enablement](#kube-monitoring-plugin-enablement) section.

**Step 3:**

Create a Thanos Query Plugin by following the [Thanos Query](#thanos-query) section.

## Configuration

### Object Store preparation

To run Thanos, you need object storage credentials. Get the credentials of your provider and add them to a Kubernetes Secret. The [Thanos documentation](https://thanos.io/tip/thanos/storage.md/) provides a great overview on the different supported store types.

Usually this looks somewhat like this

```yaml
type: $STORAGE_TYPE
config:
    user:
    password:
    domain:
    ...
```

If you've got everything in a file, deploy it in your remote cluster in the namespace, where Prometheus and Thanos will be.

**Important:** `$THANOS_PLUGIN_NAME` is needed later for the respective Thanos plugin and they must not be different!

```
kubectl create secret generic $THANOS_PLUGIN_NAME-metrics-objectstore --from-file=thanos.yaml=/path/to/your/file
```

### kube-monitoring plugin enablement 

Prometheus in kube-monitoring needs to be altered to have a sidecar and ship metrics to the new object store too. You have to provide the Secret you've just created to the (most likely already existing) kube-monitoring plugin. Add this:

```yaml
spec:
    optionValues:
      - name: kubeMonitoring.prometheus.prometheusSpec.thanos.objectStorageConfig.existingSecret.key
        value: thanos.yaml
      - name: kubeMonitoring.prometheus.prometheusSpec.thanos.objectStorageConfig.existingSecret.name
        value: $THANOS_PLUGIN_NAME-metrics-objectstore
```

Values used here are described in the [Prometheus Operator Spec](https://prometheus-operator.dev/docs/api-reference/api/#monitoring.coreos.com/v1.ThanosSpec).

### Thanos Query

This is the real deal now: Define your Thanos Query by creating a plugin.

**NOTE1:** `$THANOS_PLUGIN_NAME` needs to be consistent with your secret created earlier.

**NOTE2:** The `releaseNamespace` needs to be the same as to where kube-monitoring resides. By default this is kube-monitoring. 

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: $YOUR_CLUSTER_NAME
spec:
  pluginDefinition: thanos
  disabled: false
  clusterName: $YOUR_CLUSTER_NAME 
  releaseNamespace: kube-monitoring
```

### [OPTIONAL] Handling your Prometheus and Thanos Stores.
#### Default Prometheus and Thanos Endpoint

Thanos Query is automatically adding the Prometheus and Thanos endpoints. If you just have a single Prometheus with Thanos enabled this will work out of the box. Details in the next two chapters. See [Standalone Query](#standalone-query) for your own configuration.

### Prometheus Endpoint
Thanos Query would check for a service `prometheus-operated` in the same namespace with this GRPC port to be available `10901`. The cli option looks like this and is configured in the Plugin itself:

`--store=prometheus-operated:10901`

### Thanos Endpoint
Thanos Query would check for a Thanos endpoint named like `releaseName-store`. The associated command line flag for this parameter would look like:

`--store=thanos-kube-store:10901`

If you just have one occurence of this Thanos plugin dpeloyed, the default option would work and does not need anything else.

### Standalone Query

![Standalone Query](img/Thanos-standalone-query.png)

In case you want to achieve a setup like above and have an overarching Thanos Query to run with multiple Stores, you can set it to `standalone` and add your own store list. Setup your Plugin like this:

```yaml
spec:
  optionsValues:
  - name: thanos.query.standalone
    value: true
```

This would enable you to either:

* query multiple stores with a single Query
    ```yaml
    spec:
      optionsValues:
      - name: thanos.query.stores
        value:
          - thanos-kube-1-store:10901 
          - thanos-kube-2-store:10901 
          - kube-monitoring-1-prometheus:10901 
          - kube-monitoring-2-prometheus:10901 
    ```
* query multiple Thanos Queries with a single Query
  Note that there is no `-store` suffix here in this case.

    ```yaml
    spec:
      optionsValues:
      - name: thanos.query.stores
        value:
          - thanos-kube-1:10901
          - thanos-kube-2:10901
    ```

## Operations

### Thanos Compactor

If you deploy the plugin with the default values, Thanos compactor will be shipped too and use the same secret (`$THANOS_PLUGIN_NAME-metrics-objectstore`) to retrieve, compact and push back timeseries.

Based on experience, a 100Gi-PVC is used in order not to overload the ephermeral storage of the Kubernetes Nodes. Depending on the configured retention and the amount of metrics, this may not be sufficient and larger volumes may be required. In any case, it is always safe to clear the volume of the compactor and increase it if necessary. 

The object storage costs will be heavily impacted on how granular timeseries are being stored (reference [Downsampling](https://thanos.io/tip/components/compact.md/#downsampling)). These are the pre-configured defaults, you can change them as needed:

```
raw: 777600s (90d)
5m: 777600s (90d)
1h: 157680000 (5y)
```
