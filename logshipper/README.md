---
title: Logshipper
---

This Plugin is intended for shipping container and systemd logs to an Elasticsearch/ OpenSearch cluster. It uses fluentbit to collect logs. The default configuration can be found under `chart/templates/fluent-bit-configmap.yaml`.

Components included in this Plugin:

- [fluentbit](https://fluentbit.io/)

## Owner

1. @ivogoman

## Parameters

| Name                                                         | Description                                                                                                         | Value                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `fluent-bit.parser`                                          | Parser used for container logs. [docker\|cri] labels                                                                |           "cri"          |
| `fluent-bit.backend.opensearch.host`                         | Host for the Elastic/OpenSearch HTTP Input                                                                          |                          |
| `fluent-bit.backend.opensearch.port`                         | Port for the Elastic/OpenSearch HTTP Input                                                                          |                          |
| `fluent-bit.backend.opensearch.http_user`                    | Username for the Elastic/OpenSearch HTTP Input                                                                      |                          |
| `fluent-bit.backend.opensearch.http_password`                | Password for the Elastic/OpenSearch HTTP Input                                                                      |                          |
| `fluent-bit.backend.opensearch.host`                         | Host for the Elastic/OpenSearch HTTP Input                                                                          |                          |
| `fluent-bit.filter.additionalValues`                         | list of Key-Value pairs to label logs labels                                                                        |             []           |
| `fluent-bit.customConfig.inputs`                             | multi-line string containing additional inputs                                                                      |                          |
| `fluent-bit.customConfig.filters`                            | multi-line string containing additional filters                                                                     |                          |
| `fluent-bit.customConfig.outputs`                            | multi-line string containing additional outputs                                                                     |                          |

## Custom Configuration

To add custom configuration to the fluent-bit configuration please check the fluentbit documentation [here](https://docs.fluentbit.io/manual/).
The `fluent-bit.customConfig.inputs`, `fluent-bit.customConfig.filters` and `fluent-bit.customConfig.outputs` parameters can be used to add custom configuration to the default configuration. The configuration should be added as a multi-line string.
Inputs are rendered after the default inputs, filters are rendered after the default filters and before the additional values are added. Outputs are rendered after the default outputs.
The additional values are added to all logs disregaring the source.

Example Input configuration:

```yaml
fluent-bit:
  config:
    inputs: |
      [INPUT]
          Name             tail-audit
          Path             /var/log/containers/greenhouse-controller*.log
          Parser           {{ default "cri" ( index .Values "fluent-bit" "parser" ) }}
          Tag              audit.*
          Refresh_Interval 5
          Mem_Buf_Limit    50MB
          Skip_Long_Lines  Off
          Ignore_Older     1m
          DB               /var/log/fluent-bit-tail-audit.pos.db
```


Logs collected by the default configuration are prefixed with `default_`. In case that logs from additional inputs are to be send and processed by the same filters and outputs, the prefix should be used as well.

In case additional secrets are required the `fluent-bit.env` field can be used to add them to the environment of the fluent-bit container. The secrets should be created by adding them to the `fluent-bit.backend` field.
```yaml
fluent-bit:
  backend:
    audit:
      http_user: top-secret-audit
      http_password: top-secret-audit
      host: "audit.test"
      tls:
        enabled: true
        verify: true
        debug: false


```
