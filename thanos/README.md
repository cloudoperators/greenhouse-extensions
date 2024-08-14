---
title: Thanos
---

# Information

This plugin deploys the following Thanos components:

* Query
* Compact
* Store
<!--* Query Frontend-->
<!--* (Ruler)-->

Requirements (detailed steps below):
* ready to use credentials for a [compatible object store](https://thanos.io/tip/thanos/storage.md/)
* [thanos-sidecar enabled in Prometheus](#kube-monitoring-plugin-enablement) (usually with [Prometheus Operator](https://prometheus-operator.dev/docs/api-reference/api/#monitoring.coreos.com/v1.ThanosSpec)).

# Owner

1. Tommy Sauer (@viennaa) 
2. Richard Tief (@richardtief) 
3. Martin Vossen (@artherd42) 

# Configuration

## Object Store preparation

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


## kube-monitoring plugin enablement 

Prometheus in kube-monitoring needs to be altered to have a sidecar and ship metrics to the new object store too. You have to provide the Secret you've just created to the (most likely already existing) kube-monitoring plugin. Add this:

```yaml
spec:
    optionValues:
      - name: kubeMonitoring.prometheus.prometheusSpec.thanos.objectStorageConfig.existingSecret.key
        value: thanos.yaml
      - name: kubeMonitoring.prometheus.prometheusSpec.thanos.objectStorageConfig.existingSecret.name
        value: $THANOS_PLUGIN_NAME-metrics-objectstore
```

## Thanos Query

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

## [OPTIONAL] Handling your Prometheus and Thanos Stores.
### Default Prometheus and Thanos Endpoint

Thanos Query is automatically adding the Prometheus and Thanos endpoints. If you just have a single Prometheus with Thanos enabled this will work out of the box. Details in the next two chapters. See [Standalone Query](#standalone-query) for your own configuration.

### Prometheus Endpoint
Thanos Query would check for a service `prometheus-operated` in the same namespace with this GRPC port to be available `10901`. The cli option looks like this and is configured in the Plugin itself:

`--store=prometheus-operated:10901`

### Thanos Endpoint
Thanos Query would check for a Thanos endpoint named like `releaseName-store`. The associated command line flag for this parameter would look like:

`--store=thanos-kube-store:10901`

If you just have a single Thanos the default option would work and does not need anything else.

### Standalone Query

In case you want to have a Query to run with multiple Stores, you can set it to standalone and add your own store list. Set up your plugin like this:

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

# Operations

## Thanos Compactor

If you deploy the plugin with the default values, Thanos compactor will be shipped too and use the same secret (`$THANOS_PLUGIN_NAME-metrics-objectstore`) to retrieve, compact and push back timeseries.

It will use a 100Gi PVC to not extensively occupy ephermeral storage. Depending on the amount of metrics this might be not enought and bigger volumes are needed. It is always safe to delete the compactor volume and increase it as needed. 

The object storage costs will be heavily impacted on how granular timeseries are being stored (reference [Downsampling](https://thanos.io/tip/components/compact.md/#downsampling)). These are the pre-configured defaults, you can change them as needed:

```
raw: 777600s (90d)
5m: 777600s (90d)
1h: 157680000 (5y)
```
