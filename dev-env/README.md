# greenhouse example plugin

This is a starting point and a bootstrap template for developing greenhouse
plugins.

It proposes running several docker images next to each other. Concretely we provide a [docker-compose](docker-compose.yml) setup.
The following containers run together:

- `greenhouse`: The greenhouse core controller
- `envtest`: Local kubernetes API Server and etcd with greenhouse CRDs
- `greenhouse-ui`: The greenhouse core ui
- `app`: An example frontend for a greenhouse plugin
- `bootstrap`: A short living container bootstrapping some mock greenhouse resource for your plugin to interact with.

This setup should get you started to locally

- [Spinup and test](#plugin-with-backend) your backend applications of greenhouse plugins
- [Start developing a frontend](#ui) for a greenhouse plugin

## Get started

The setup is provided via `docker compose`.

Spin everything up as follows:

(all `docker compose` commands from within `./`):

``` bash
docker compose up -d
```

You might have to build the `greenhouse-dev-ui` and `greenhouse-dev-app` images locally until we provide them in our registry by running

``` bash
docker compose build greenhouse-ui app
```

Reach the frontend at [http://localhost:3000/](http://localhost:3000/)

A valid kubeconfig for the [EnvTest Cluster](#envtest) is placed at ./envtest/kubeconfig.
Get kubernetes resources e.g. via:

``` bash
export KUBECONFIG=<path-to-repository>/dev-env/envtest/kubeconfig
kubectl get teams -A
```

Make sure to stay up to date with our `dev-env` images and pull from time to time:

```bash
docker compose rm -f
docker compose pull
```

### Linux users

To allow the docker containers full network access within f5 VPN you must activate `network_mode=host` on containers `envtest` and `ui`.

This is prepared by using [network-host.docker-compose.yaml](./network-host.docker-compose.yml) :

```bash
docker compose -f network-host.docker-compose.yaml up -d
```

In the following we aim to provide a more detailed view on the different containers:

## greenhouse-ui and app

The `greenhouse-ui` container hosts the greenhouse shell which will in it's place will host your app as a plugin. It exposes the frontend on [http://localhost:3000](http://localhost:3000)

The `app` container hosts an exemplary greenhouse frontend application for an [example-plugin](./bootstrap/example-plugin.yaml) that comes with the bootstrapped resources of the `dev-env`:

- The `Spec.uiApplication` points to the `index.js` file hosted by the `app` container. Exemplary we integrated the [team-admin microfrontend](https://github.com/cloudoperators/greenhouse/tree/main/ui/team-admin) as the `example-plugins` frontend.
- The `Spec.ClusterName` points to the cluster named `self`. This is the mock cluster running in the `envtest` container. See [EnvTest](#envtest)
- The `Spec.HelmChart` references an exemplary bitnami/mysql chart.

The ui of a greenhouse plugin always is a standalone micro-frontend.

We use [Juno Frontends](https://github.com/cloudoperators/juno)

### Start testing / developing your own

Looking at a `plugin.yaml` containing a `PluginDefinition`:

- The `Spec.HelmChart` references a packaged helm chart in a registry.
- The `Spec.uiApplication` points to the `index.js` file of a standalone javascript frontend application.
- The `Spec.ClusterName` points to a cluster onboarded to greenhouse.

#### Plugin with backend

Greenhouse `Plugin` backends are shipped as [helm charts](https://helm.sh/). We expect your backend application to be deployable as such.

If you intend to write a plugin that interacts with `Greenhouse` resources, such as `teams`,`clusters`, etc. you will have some kind of controller interacting with the kubernetes API of `Greenhouse`. To do so your client will consume a `kubeconfig`.

The [EnvTest](#envtest) container provides a kubeconfig. Use it as such:

```bash
export KUBECONFIG=<path-to-repository>/dev-env/envtest/kubeconfig
```

Within `go` code you could create a client via the [GetConfigOrDie()](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/client/config#GetConfigOrDie) func which (among others) fallbacks to creating a client from a kubeconfig referenced via `KUBECONFIG` environment variable. Other clients provide similar methods.

To **test** your plugin (a.k.a. `PluginDefinition` yaml file) with a backend (a.k.a. helm chart) the proposed way is:

- Spin up the `dev-env` and export `KUBECONFIG` env var.
- Deploy your `PluginDefinition` to the `dev-env` with the reference to your helm chart in `Spec.helmChart`
- Onboard a cluster you have access to (e.g. local [minikube](https://minikube.sigs.k8s.io/docs/start/), [KIND](https://kind.sigs.k8s.io/docs/user/quick-start/) or other)
  For Kind clusters see [Onboarding a KIND cluster](#onboarding-a-kind-cluster)

  ```bash
  kubectl --namespace=test-org create secret generic <cluster-name> --type=greenhouse.sap/kubeconfig --from-file=kubeconfig=<your-cluster-kubeconfig.yaml>
  ```

- Check that your cluster is `ready` [in UI](<http://localhost:3000/?org=test-org&__s=(greenhouse:(a:greenhouse~Fmanagement),greenhouse~Fmanagement:(a:greenhouse~Fcluster~Fadmin))>) or via

  ```bash
  kubectl get clusters -n test-org
  ```

- Deploy a `Plugin` to the `test-org` namespace with `Spec.ClusterName` set to your onboarded cluster. Fill out the necessary `OptionValues`.
- The resources of your Plugin will be installed to your onboarded cluster into the `Spec.RekeaseNamespace` namespace. View your running Application there.

See [greenhouse](#greenhouse) for how to access the greenhouse controller logs.

#### UI

We extracted the `team-admin` frontend into the `app` container.

Start copying this example ui application into your own repo folder `<path-to-example-app>` as such:

```bash
docker compose cp app:app/ <path-to-example-app>
```

To develop the application standalone, just run

```bash
cd <path-to-example-app>
npm install
npm run start
```

The frontend is served on [localhost:3000](http://localhost:3000) with a file watcher and live reload.

## envtest

Runs a local k8s api server with a local etcd
[using the golang envtest package](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/envtest).
All greenhouse CRDs are bootstrapped.

Three different contexts are bootstrapped:

1. `cluster-admin` the name speaks for itself and is the **default** if no context is provided
2. `test-org-admin` Access the cluster as org-admin for the bootstrapped
   `test-org`
3. `test-org-member` Access the cluster as org-member for the bootstrapped
   `test-org`

The apiserver is proxied and accessible on port `8090`. Set your desired context via env var before container startup (unset var / default: `cluster-admin`):

```bash
export DEV_ENV_CONTEXT=<your-context>
docker-compose up
```

As per default a local directory is mounted to `/envtest` to be able to access
the `kubeconfig` file on your local machine.

Client certificate and key files for all three contexts are written to the same folder for the sake of completeness.

Access the local api server via `kubectl`, e.g.:

```bash
export KUBECONFIG=<path-to-repository>/dev-env/envtest/kubeconfig
kubectl get teams
```

## greenhouse

Runs the greenhouse core aka controller manager against the local api server.

See `greenhouse` logs as such:

```bash
docker-compose logs -f greenhouse
```

Remove the `example-plugin` to get rid of the logging "noise" it produces.

## bootstrap

Bootstraps all resources in [./bootstrap](./bootstrap):

- organization [test-org](./bootstrap/test-org.yaml)
- [test-team-1 through test-team-3](./bootstrap/teams.yaml) within organization `test-org`
- respective dummy teammemberships for both teams
- [cluster-1 through cluster-3 and self](./bootstrap/clusters.yaml) with different conditions and states
- some [dummy nodes](./bootstrap/nodes.yaml) for clusters
- some [plugindefinitions with plugins](./bootstrap/plugins.yamls) across the clusters

Bootstrap your own resources by adding the yaml files to `./bootstrap`.

## Onboarding a KIND cluster

[!info] This section is currently not working on Linux due to docker network issues in combination with VPN.

This requires that [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) is installed.

A kind cluster can be added to the `envtest` enviroment by executing `./onboard-cluster.sh`.
This script will create a new kind cluster, make the cluster accessible from the `envtest` environment and onboard the cluster to the `test-org` organization.

In case you need additional cluster the script can be called with the desired cluster name as argument.

```bash
./onboard-cluster.sh <cluster-name>
```

After the cluster is onboarded, the kubeconfig can be found in `./envtest/<cluster-name>.kubeconfig`.
The status of the cluster can be checked with:
  
  ```bash
  kubectl --kubeconfig ./envtest/kubeconfig -n test-org get clusters
  ```
