# greenhouse example plugin

This is a starting point and a bootstrap template for developing greenhouse
plugins.

It proposes running several docker images next to each other. Concretely we provide a [docker-compose](docker-compose.yml) setup.
The following containers run together:

- `greenhouse`: The greenhouse core controller
- `envtest`: Local kubernetes API Server and etcd with greenhouse CRDs
- `greenhouse-ui`: The greenhouse core ui hosting your plugin
- `app`: An example app integrated as a greenhouse plugin
- `bootstrap`: A short living container bootstrapping some mock greenhouse resource for your plugin to interact with.

This setup should get you started to locally

- [Spinup and test](#plugin-with-backend) your backend applications of greenhouse plugins
- [Start developing a frontend](#ui) for a greenhouse plugin

## Get started

The setup is provided via `docker-compose`.

Spin everything up as follows:

(all `docker-compose` commands from within `./`):

```
docker-compose up
```

Reach the frontend at [http://localhost:3001/](http://localhost:3001/)

A valid kubeconfig for the [EnvTest Cluster](#envtest) is placed at ./envtest/kubeconfig.
Get kubernetes resources e.g. via:

```
export KUBECONFIG=<path-to-repository>/dev-env/envtest/kubeconfig
kubectl get teams -A
```

Make sure to stay up to date with our `dev-env` images and pull from time to time:

```
docker-compose rm -f
docker-compose pull
```

### Linux users

To allow the docker containers full network access within f5 VPN you must activate `network_mode=host` on containers `envtest` and `ui`.

This is prepared by using [network-host.docker-compose.yaml](./network-host.docker-compose.yml) :

```
docker-compose -f network-host.docker-compose.yaml up
```

In the following we aim to provide a more detailed view on the different containers:

## greenhouse-ui and app

The `greenhouse-ui` container hosts the greenhouse shell which will in it's place host your app as a plugin. It exposes the frontend on [http://localhost:3001](http://localhost:3001)

The `app` container hosts an exemplary juno frontend application for an [example-plugin](./bootstrap/example-plugin.yaml) that comes with the bootstrapped resources of the `dev-env`:

- The `Spec.uiApplication` points to the `index.js` file hosted by the `app` container. It runs a nginx web server pointing at a built Juno/React app's index.js. Exemplary we integrated the [the juno example app](https://github.com/sapcc/juno/tree/main/apps/exampleapp) as the `example-plugins` frontend.
- The `Spec.ClusterName` points to the cluster named `self`. This is the mock cluster running in the `envtest` container. See [EnvTest](#envtest)
- The `Spec.HelmChart` references an exemplary bitnami/mysql chart.

The ui of a greenhouse plugin always is a [juno application](https://github.com/sapcc/juno/blob/main/docs/build_and_host_app.md).

Juno among other things provides a powerful library of [ready to use frontend components](https://ui.juno.global.cloud.sap/?path=/story/components-badge--default).

Take a look at the [best practices provided by the ui team](https://ui-team.global.cloud.sap/docs/projects/juno/bestpractices/).

### Start testing / developing your own

#### Plugin with backend

To **develop** a plugin with a custom backend you will have some kind of controller interacting with kubernetes. To do so your client will consume a `kubeconfig`.

The [EnvTest](#envtest) container provides a kubeconfig. Use it as such:

```
export KUBECONFIG=<path-to-repository>/dev-env/envtest/kubeconfig
```

Within `go` code you could create a client via the [GetConfigOrDie()](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/client/config#GetConfigOrDie) func which (among others) fallbacks to creating a client from a kubeconfig referenced via `KUBECONFIG` environment variable. Other clients provide similar methods.

To **test** your plugin with a backend (a.k.a. helm chart) the proposed way is:

- Spin up the `dev-env` and export `KUBECONFIG` env var.
- Deploy your Plugin to the `dev-env` with the reference to your helm chart in `Spec.helmChart`
- Onboard a cluster you have access to (e.g. local [minikube](https://minikube.sigs.k8s.io/docs/start/), [KIND](https://kind.sigs.k8s.io/docs/user/quick-start/) or other)

  ```
  kubectl --namespace=test-org create secret generic <cluster-name> --type=greenhouse.sap/kubeconfig --from-file=kubeconfig=<your-cluster-kubeconfig.yaml>
  ```

- Check that your cluster is `ready` [in UI](<http://localhost:3001/?org=test-org&__s=(greenhouse:(a:greenhouse~Fmanagement),greenhouse~Fmanagement:(a:greenhouse~Fcluster~Fadmin))>) or via
  ```
  kubectl get clusters -n test-org
  ```
- Deploy a Plugin to the `test-org` namespace with `Spec.ClusterName` set to your onboarded cluster
- The resources of your Plugin will be installed to your onboarded cluster into the `test-org` namespace. View your running Application there.

See [greenhouse](#greenhouse) for how to access the greenhouse controller logs.

#### UI

Start copying the example ui application into your own repo folder `<path-to-example-app>` as such:

```
docker compose cp app:app/ <path-to-example-app>
```

To develop the application standalone, just run

```
cd <path-to-example-app>
npm install
npm run start
```

The frontend is served on [localhost:3000](http://localhost:3000) with a file watcher and live reload.

To actually view your code in the greenhouse frontend, execute the `build` script provided:

```
npm run build
```

This will build your application.
Then mount your app to the app container within [docker-compose.yaml](./docker-compose.yml). The nginx will serve your application now.

(uncomment lines in docker-compose.yaml):

```
services:
  app:
    image: ghcr.io/cloudoperators/greenhouse-dev-app:dev-latest
    # uncomment to mount your folder:
    # volumes:
    #   - /path/to/app/:/app/
```

Start the docker containers:

```
docker-compose up -d
```

You will now see your application running as a greenhouse plugin on [localhost:3001](http://localhost:3001)

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

```
export DEV_ENV_CONTEXT=<your-context>
docker-compose up
```

As per default a local directory is mounted to `/envtest` to be able to access
the `kubeconfig` file on your local machine.

Client certificate and key files for all three contexts are written to the same folder for the sake of completeness.

Access the local api server via `kubectl`, e.g.:

```
export KUBECONFIG=<path-to-repository>/dev-env/envtest/kubeconfig
kubectl get teams
```

## greenhouse

Runs the greenhouse core aka controller manager against the local api server.

See `greenhouse` logs as such:

```
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
