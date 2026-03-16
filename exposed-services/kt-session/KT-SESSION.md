# KT Session

## Local Development of Helm Chart and PluginDefinition

The following is a walk-through to PluginDefinition development using the `exposed-service` as an example. A simple change (introduce pod labels on the deployment) of the Helm chart is used to illustrate PluginDefinition development. All changes made are part of this feature branch. All cli commands are executed from the `kt-session` folder.

### Setup local env

https://cloudoperators.github.io/greenhouse/docs/contribute/local-dev/#test-greenhouse-extensions-with-local-oci-registry

- run 
  ```bash
  make setup
  ``` 
  from local [cloudoperators/greenhouse](https://github.com/cloudoperators/greenhouse) repository folder

- export necessary env vars
  
  ```bash
  export REGISTRY_CA=$PWD/bin/ca.crt
  export OCI=oci://127.0.0.1:5000/cloudoperators/greenhouse-extensions/charts
   ```

- get local CA file

  ```bash
  kubectl --context=kind-greenhouse-admin get secret local-registry-tls-certs \
  -n flux-system -o jsonpath='{.data.ca\.crt}' | base64 -d > "$REGISTRY_CA"
  ```

- port-forward local registry

  ```bash
  kubectl --context=kind-greenhouse-admin port-forward svc/registry -n flux-system 5000:5000&
  ```

### Deploy exposed-service PD with PP

- Deploy files with kubectl to greenhouse-admin

  ```bash
  kubectl apply -f ../plugindefinition.yaml -n demo --context kind-greenhouse-admin
  kubectl apply -f pluginpreset.yaml -n demo --context kind-greenhouse-admin
  ```

### Update helm chart 

- change deployment.yaml `labels`

  ```yaml
          {{- include "exposed-service.selectorLabels" . | nindent 8 }}
          {{- with .Values.pod.additionalLabels }}
          {{- toYaml . | nindent 8 }}
          {{- end }}
  ```

- bump chart version
- package and push chart
  
  ```bash
  export PKG=$(helm package $PWD/../charts/v2.0.0/exposed-service -d ./bin | awk '{print $NF}')
  helm push $PKG $OCI --ca-file "$REGISTRY_CA" --plain-http=false
  ```

- bump PD version and apply to Greenhouse cluster
- Look at PD error
- replace repository with local registry on PluginDefinition: `ghcr.io` to `registry.flux-system.svc.cluster.local:5000`

### Set default labels on PD

- update plugindefinition.yaml

  ```yaml
    options:
      - name: pod.additionalLabels
        description: Labels used on pod
        default: 
          organization: demo
        required: false
        type: map
  ```

- bump PD version and apply to Greenhouse cluster

### Set cluster-specific labels on PP

- update pluginpreset.yaml

  ```yaml
  spec:
    plugin:
      optionValues:
      - name: pod.additionalLabels
        value:
          cluster-type: greenhouse-remote
  ```

- apply PP to Greenhouse cluster

> Note: overrides PluginDefinition labels

## Remote Development and QA of PluginDefinition

- remove local registry override from PluginDefinition

### Open feature branch on cloudoperators/greenhouse-extensions with helm label value changes

Commit changes to exposed-service helm-chart and PD to `feat/kt-session`

### Make sure helm chart is present on the respective registries and mirrors

Push your helm chart to ghcr. [Use cloudoperators workflow](https://github.com/cloudoperators/greenhouse-extensions/actions/workflows/helm-release.yaml).

### Deploy Catalog watching this feature branch to greenhouse-playground

- deploy Catalog to your running Greenhouse Organization
  
  ```bash
  kubectl apply -f catalog-feature-branch.yaml -n <your-org>
  ```

- deploy the PluginPreset and adust the `clusterSelector`
  
  ```bash
  kubectl apply -f pluginpreset.aml -n <your-org>
  ```

- explain registry override in Catalog
- publish some update to the PD (change default label)

## Prod LCM of PD

- Use a [Catalog following tags](./Catalog-tagged.yaml)
- Publish a new tag of `exposed-services`.
  - release workflow used in cloudoperators/greenhouse-extensions: publishes git-tag on PD.version update
- Have look at [some example renovate config](./renovate.json) for Catalog bumps with PD git tag releases.
- Trigger renovate run
- Have a look at the renovate PR
- For further staggering of rollouts: Look at renovate [automerge](https://docs.renovatebot.com/key-concepts/automerge/), especially with [time delays](https://docs.renovatebot.com/configuration-options/#await-x-time-duration-before-automerging).