# thanos

Base chart for thanos monitoring deployments

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://prometheus-community.github.io/helm-charts | prometheus-operator(kube-prometheus-stack) | 69.3.3 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.commonLabels | object | the chart will add some internal annotations automatically | Labels to apply to all resources |
| global.imageRegistry | string | `nil` | Overrides the registry globally for all images |
| testFramework.enabled | bool | `true` |  |
| testFramework.image.registry | string | `"ghcr.io"` |  |
| testFramework.image.repository | string | `"cloudoperators/greenhouse-extensions-integration-test"` |  |
| testFramework.image.tag | string | `"main"` |  |
| testFramework.imagePullPolicy | string | `"IfNotPresent"` |  |
| thanos.compactor.additionalArgs | list | `[]` |  |
| thanos.compactor.annotations | list | `[]` |  |
| thanos.compactor.compact.cleanupInterval | string | `nil` |  |
| thanos.compactor.compact.concurrency | string | `nil` |  |
| thanos.compactor.compact.waitInterval | string | `nil` |  |
| thanos.compactor.consistencyDelay | string | `nil` |  |
| thanos.compactor.containerLabels | list | `[]` |  |
| thanos.compactor.enabled | bool | `true` |  |
| thanos.compactor.httpGracePeriod | string | `nil` |  |
| thanos.compactor.labels | list | `[]` |  |
| thanos.compactor.logLevel | string | `nil` |  |
| thanos.compactor.retentionResolution1h | string | `nil` |  |
| thanos.compactor.retentionResolution5m | string | `nil` |  |
| thanos.compactor.retentionResolutionRaw | string | `nil` |  |
| thanos.compactor.serviceLabels | string | `nil` |  |
| thanos.compactor.volume.enabled | string | `nil` |  |
| thanos.compactor.volume.labels | list | `[]` |  |
| thanos.compactor.volume.size | string | `nil` |  |
| thanos.grpcAddress | string | `nil` |  |
| thanos.httpAddress | string | `nil` |  |
| thanos.image.pullPolicy | string | `nil` |  |
| thanos.image.repository | string | `"quay.io/thanos/thanos"` |  |
| thanos.image.tag | string | `"v0.37.2"` |  |
| thanos.initChownData.image.registry | string | `"docker.io"` | The Docker registry |
| thanos.initChownData.image.repository | string | `"library/busybox"` |  |
| thanos.initChownData.image.sha | string | `""` |  |
| thanos.initChownData.image.tag | string | `"stable"` |  |
| thanos.query.additionalArgs | list | `[]` |  |
| thanos.query.annotations | string | `nil` |  |
| thanos.query.autoDownsampling | bool | `true` |  |
| thanos.query.containerLabels | string | `nil` |  |
| thanos.query.deploymentLabels | object | `{}` |  |
| thanos.query.logLevel | string | `nil` |  |
| thanos.query.replicaLabels | string | `nil` |  |
| thanos.query.replicas | string | `nil` |  |
| thanos.query.serviceLabels | string | `nil` |  |
| thanos.query.standalone | bool | `false` |  |
| thanos.query.stores | list | `[]` |  |
| thanos.query.web.externalPrefix | string | `nil` |  |
| thanos.query.web.routePrefix | string | `nil` |  |
| thanos.ruler.alertLabels | string | `nil` |  |
| thanos.ruler.alertmanagers.authentication.enabled | bool | `true` |  |
| thanos.ruler.alertmanagers.authentication.ssoCert | string | `nil` |  |
| thanos.ruler.alertmanagers.authentication.ssoKey | string | `nil` |  |
| thanos.ruler.alertmanagers.enabled | bool | `true` |  |
| thanos.ruler.alertmanagers.hosts | string | `nil` |  |
| thanos.ruler.annotations | string | `nil` |  |
| thanos.ruler.enabled | bool | `true` |  |
| thanos.ruler.externalPrefix | string | `"/ruler"` |  |
| thanos.ruler.labels | string | `nil` |  |
| thanos.ruler.matchLabel | string | `nil` |  |
| thanos.ruler.serviceLabels | string | `nil` |  |
| thanos.serviceMonitor.additionalLabels | object | `{}` |  |
| thanos.serviceMonitor.selfMonitor | bool | `true` |  |
| thanos.store.additionalArgs | list | `[]` |  |
| thanos.store.annotations | string | `nil` |  |
| thanos.store.chunkPoolSize | string | `nil` |  |
| thanos.store.containerLabels | string | `nil` |  |
| thanos.store.deploymentLabels | object | `{}` |  |
| thanos.store.enabled | bool | `true` |  |
| thanos.store.indexCacheSize | string | `nil` |  |
| thanos.store.logLevel | string | `nil` |  |
| thanos.store.serviceLabels | string | `nil` |  |
