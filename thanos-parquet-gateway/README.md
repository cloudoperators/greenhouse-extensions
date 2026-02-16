---
title: Thanos Parquet Gateway
---

This plugin deploys the following Thanos Parquet Gateway components:

* Thanos Parquet Gateway convert

The Thanos Parquet Gateway convert enables long-term storage of Prometheus metrics by converting traditional
TSDB (Time Series Database) blocks into the columnar Parquet format.
This conversion process significantly reduces storage costs by 70-90% while maintaining full query
compatibility through the Thanos Query interface, making it ideal for organizations requiring
extended retention periods without the overhead of traditional time-series storage.

Organizations should consider converting Prometheus data to Parquet format when metrics need to be
retained beyond the typical 30-90 day window, when storage costs become prohibitive for large-scale
deployments, or when historical metrics need to be integrated with data lake analytics platforms.
This approach is particularly valuable for compliance requirements, long-term trend analysis,
and capacity planning scenarios where query frequency is lower but data retention must span months or years.

* Thanos Parquet Gateway serve

The Thanos Parquet Gateway serve acts as a transparent Store API bridge that enables Thanos Query
to seamlessly retrieve metrics from Parquet files stored in object storage, exposing a standard gRPC interface
identical to other Thanos components.
When Thanos Query issues a series request, the gateway dynamically locates relevant Parquet files
based on time range and label matchers, reads only the necessary column chunks to minimize data transfer,
and streams the results back in the native Thanos protobuf format without requiring any modifications
to existing query infrastructure.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.commonLabels | object | the chart will add some internal labels automatically | Labels to apply to all resources |
| global.imageRegistry | string | `nil` | Overrides the registry globally for all images |
| thanosParquetGateway.convert.args.sortingLabels[0] | string | `"__name__"` |  |
| thanosParquetGateway.convert.args.sortingLabels[1] | string | `"namespace"` |  |
| thanosParquetGateway.convert.destination.access_key | string | `""` |  |
| thanosParquetGateway.convert.destination.bucket | string | `"destination"` |  |
| thanosParquetGateway.convert.destination.endpoint | string | `"host.docker.internal:9000"` |  |
| thanosParquetGateway.convert.destination.secret_key | string | `""` |  |
| thanosParquetGateway.convert.enabled | bool | `false` |  |
| thanosParquetGateway.convert.source.access_key | string | `""` |  |
| thanosParquetGateway.convert.source.bucket | string | `"source"` |  |
| thanosParquetGateway.convert.source.endpoint | string | `"host.docker.internal:9000"` |  |
| thanosParquetGateway.convert.source.secret_key | string | `""` |  |
| thanosParquetGateway.enabled | bool | `true` |  |
| thanosParquetGateway.existingObjectStoreSecret.configFile | string | thanos.yaml | Object store config file name |
| thanosParquetGateway.existingObjectStoreSecret.name | string | {{ include "release.name" . }}-metrics-objectstore | Use existing objectStorageConfig Secret data and configure it to be used by Thanos Compactor and Store https://thanos.io/tip/thanos/storage.md/#s3 |
| thanosParquetGateway.image.pullPolicy | string | `"IfNotPresent"` |  |
| thanosParquetGateway.image.repository | string | `"keppel.global.cloud.sap/ccloud/thanos-parquet-gateway"` |  |
| thanosParquetGateway.image.tag | string | `"20260123125451"` |  |
| thanosParquetGateway.initChownData.image.registry | string | `"docker.io"` |  |
| thanosParquetGateway.initChownData.image.repository | string | `"library/busybox"` |  |
| thanosParquetGateway.initChownData.image.sha | string | `""` |  |
| thanosParquetGateway.initChownData.image.tag | string | `"stable"` |  |
| thanosParquetGateway.objectStorageConfig.existingSecret | object | `{}` |  |
| thanosParquetGateway.serve.access_key | string | `""` |  |
| thanosParquetGateway.serve.bucket | string | `"destination"` |  |
| thanosParquetGateway.serve.enabled | bool | `true` |  |
| thanosParquetGateway.serve.endpoint | string | `"host.docker.internal:9000"` |  |
| thanosParquetGateway.serve.secret_key | string | `""` |  |
| thanosParquetGateway.serve.volume.labels | list | `[]` |  |
| thanosParquetGateway.serve.volume.size | string | `nil` |  |