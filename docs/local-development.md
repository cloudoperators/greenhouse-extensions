## Generate local plugin definitions

In order to simplify local development and testing of greenhouse extensions the script in `hack/local-plugin-definitions` 
can be used to generate local `PluginDefinitions`. 

### Prerequisites

- Please follow the [Setting up a local development environment](https://github.com/cloudoperators/greenhouse/blob/main/dev-env/localenv/README.md#setting-up-a-local-development-environment) guide to setup the local environment
- Follow the instructions in [Test Plugin / Greenhouse Extension charts locally](https://github.com/cloudoperators/greenhouse/blob/main/dev-env/localenv/README.md#test-plugin--greenhouse-extension-charts-locally) to setup a local extension testing environment

### Usage

```bash
  make local-plugin-definitions
```

1. The script will extract each `plugindefintion.yaml` from all the extensions' directories
2. The script will modify certain fields in the `plugindefintion.yaml` to make it compatible with the local setup
3. All the modified `plugindefintion.yaml` will be saved in the `bin/.generated` directory

** Example **

Original `plugindefintion.yaml` of `perses` extension

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: PluginDefinition
metadata:
  name: perses
spec:
  version: 0.3.1
  displayName: Perses
  description: "Perses is a dashboard tooling to visualize metrics and traces produced by observability tools such as Prometheus/Thanos/Jaeger"
  docMarkDownUrl: https://raw.githubusercontent.com/cloudoperators/greenhouse-extensions/main/perses/README.md
  icon: https://raw.githubusercontent.com/cloudoperators/greenhouse-extensions/main/perses/logo.png
  helmChart:
    name: perses
    repository: oci://ghcr.io/cloudoperators/greenhouse-extensions/charts
    version: '0.9.1'
  options: [...]
```

Generated `plugindefintion.yaml` of `perses` extension

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: PluginDefinition
metadata:
  name: perses
spec:
  description: Perses is a dashboard tooling to visualize metrics and traces produced by observability tools such as Prometheus/Thanos/Jaeger
  displayName: Perses
  docMarkDownUrl: https://raw.githubusercontent.com/cloudoperators/greenhouse-extensions/main/perses/README.md
  helmChart:
    name: local/plugins/perses
    repository: ""
    version: ""
  icon: https://raw.githubusercontent.com/cloudoperators/greenhouse-extensions/main/perses/logo.png
  options: [...]
```

> [!NOTE]
> `spec.helmChart.name` references only to extension dir name
> before applying it to the local cluster you would need to append the remaining path to baseDir that contains the `Chart.yaml` file
> e.g. `local/plugins/perses` -> `local/plugins/perses/charts`

