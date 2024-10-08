---
title: Alerts
---

This plugin extension contains [Prometheus Alertmanager](https://github.com/prometheus/alertmanager) via [prometheus-operator](https://github.com/prometheus-operator/prometheus-operator) and [Supernova](https://github.com/sapcc/supernova), the holistic alert management UI.

# Owner

1. Richard Tief (@richardtief)
2. Tommy Sauer (@viennaa)
3. Martin Vossen (@artherd42)

### alerts alertmanager parameters

| Name                                                               | Description                                                                                                                | Value   |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| `alerts.commonLabels`                                              | Labels to apply to all resources                                                                                           | `{}`    |
| `alerts.alertmanager.enabled`                                      | Deploy Prometheus Alertmanager                                                                                             | `true`  |
| `alerts.alertmanager.annotations`                                  | Annotations for Alertmanager                                                                                               | `{}`    |
| `alerts.alertmanager.config`                                       | Alertmanager configuration directives.                                                                                     | `{}`    |
| `alerts.alertmanager.ingress.enabled`                              | Deploy Alertmanager Ingress                                                                                                | `false` |
| `alerts.alertmanager.ingress.hosts`                                | Must be provided if Ingress is enabled.                                                                                    | `[]`    |
| `alerts.alertmanager.ingress.tls`                                  | Must be a valid TLS configuration for Alertmanager Ingress. Supernova UI passes the client certificate to retrieve alerts. | `{}`    |
| `alerts.alertmanager.ingress.ingressClassname`                     | Specifies the ingress-controller                                                                                           | `nginx` |
| `alerts.alertmanager.servicemonitor.additionalLabels`              | kube-monitoring `plugin: <plugin.name>` to scrape Alertmanager metrics.                                                    | `{}`    |
| `alerts.alertmanager.alertmanagerConfig.slack.routes[].name`       | Name of the Slack route.                                                                                                   | `""`    |
| `alerts.alertmanager.alertmanagerConfig.slack.routes[].channel`    | Slack channel to post alerts to. Must be defined with `slack.webhookURL`.                                                  | `""`    |
| `alerts.alertmanager.alertmanagerConfig.slack.routes[].webhookURL` | Slack webhookURL to post alerts to. Must be defined with `slack.channel`.                                                  | `""`    |
| `alerts.alertmanager.alertmanagerConfig.slack.routes[].matchers`   | List of matchers that the alert's label should match. matchType <string>, name <string>, regex <boolean>, value <string>   | `[]`    |
| `alerts.alertmanager.alertmanagerConfig.webhook.routes[].name`     | Name of the webhook route.                                                                                                 | `""`    |
| `alerts.alertmanager.alertmanagerConfig.webhook.routes[].url`      | Webhook url to post alerts to.                                                                                             | `""`    |
| `alerts.alertmanager.alertmanagerConfig.webhook.routes[].matchers` | List of matchers that the alert's label should match. matchType <string>, name <string>, regex <boolean>, value <string>   | `[]`    |
| `alerts.defaultRules.create`                                       | Creates community Alertmanager alert rules.                                                                                | `true`  |
| `alerts.defaultRules.labels`                                       | kube-monitoring `plugin: <plugin.name>` to evaluate Alertmanager rules.                                                    | `{}`    |
| `alerts.alertmanager.alertmanagerSpec.alertmanagerConfiguration`   | AlermanagerConfig to be used as top level configuration                                                                    | `false` |

### alerts supernova parameters

`theme`: Override the default theme. Possible values are `"theme-light"` or `"theme-dark"` (default)

`endpoint`: Alertmanager API Endpoint URL `/api/v2`. Should be one of `alerts.alertmanager.ingress.hosts`

`silenceExcludedLabels`: SilenceExcludedLabels are labels that are initially excluded by default when creating a silence. However, they can be added if necessary when utilizing the advanced options in the silence form.The labels must be an array of strings. Example: `["pod", "pod_name", "instance"]`

`filterLabels`: FilterLabels are the labels shown in the filter dropdown, enabling users to filter alerts based on specific criteria. The 'Status' label serves as a default filter, automatically computed from the alert status attribute and will be not overwritten. The labels must be an array of strings. Example: `["app", "cluster", "cluster_type"]`

`predefinedFilters`: PredefinedFilters are filters applied through in the UI to differentiate between contexts through matching alerts with regular expressions. They are loaded by default when the application is loaded. The format is a list of objects including name, displayname and matchers (containing keys corresponding value). Example:

```json
[
  {
    "name": "prod",
    "displayName": "Productive System",
    "matchers": {
      "region": "^prod-.*"
    }
  }
]
```

`silenceTemplates`: SilenceTemplates are used in the Modal (schedule silence) to allow pre-defined silences to be used to scheduled maintenance windows. The format consists of a list of objects including description, editable_labels (array of strings specifying the labels that users can modify), fixed_labels (map containing fixed labels and their corresponding values), status, and title. Example:

```json
"silenceTemplates": [
    {
      "description": "Description of the silence template",
      "editable_labels": ["region"],
      "fixed_labels": {
        "name": "Marvin",
      },
      "status": "active",
      "title": "Silence"
    }
  ]
```

### Managing Alertmanager configuration

ref:

- https://prometheus.io/docs/alerting/configuration/#configuration-file
- https://prometheus.io/webtools/alerting/routing-tree-editor/

By default, the Alertmanager instances will start with a minimal configuration which isn’t really useful since it doesn’t send any notification when receiving alerts.

You have multiple options to provide the Alertmanager configuration:

1. You can use `alerts.alertmanager.config` to define a Alertmanager configuration. Example below.

```yaml
config:
  global:
    resolve_timeout: 5m
  inhibit_rules:
    - source_matchers:
        - "severity = critical"
      target_matchers:
        - "severity =~ warning|info"
      equal:
        - "namespace"
        - "alertname"
    - source_matchers:
        - "severity = warning"
      target_matchers:
        - "severity = info"
      equal:
        - "namespace"
        - "alertname"
    - source_matchers:
        - "alertname = InfoInhibitor"
      target_matchers:
        - "severity = info"
      equal:
        - "namespace"
  route:
    group_by: ["namespace"]
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 12h
    receiver: "null"
    routes:
      - receiver: "null"
        matchers:
          - alertname =~ "InfoInhibitor|Watchdog"
  receivers:
    - name: "null"
  templates:
    - "/etc/alertmanager/config/*.tmpl"
```

2. You can discover `AlertmanagerConfig` objects. The `spec.alertmanagerConfigSelector` is always set to `matchLabels`: `plugin: <name>` to tell the operator which `AlertmanagerConfigs` objects should be selected and merged with the main Alertmanager configuration. Note: The default strategy for a `AlertmanagerConfig` object to match alerts is `OnNamespace`.

```yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: config-example
  labels:
    alertmanagerConfig: example
    pluginDefinition: alerts-example
spec:
  route:
    groupBy: ["job"]
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 12h
    receiver: "webhook"
  receivers:
    - name: "webhook"
      webhookConfigs:
        - url: "http://example.com/"
```

3. You can use `alerts.alertmanager.alertmanagerSpec.alertmanagerConfiguration` to reference an `AlertmanagerConfig` object in the same namespace which defines the main Alertmanager configuration.

```yaml
# Example with select a global alertmanagerconfig
alertmanagerConfiguration:
  name: global-alertmanager-configuration
```

## Examples

### Deploy alerts with Alertmanager

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: alerts
spec:
  pluginDefinition: alerts
  disabled: false
  displayName: Alerts
  optionValues:
    - name: alerts.alertmanager.enabled
      value: true
    - name: alerts.alertmanager.ingress.enabled
      value: true
    - name: alerts.alertmanager.ingress.hosts
      value:
        - alertmanager.dns.example.com
    - name: alerts.alertmanager.ingress.tls
      value:
        - hosts:
            - alertmanager.dns.example.com
          secretName: tls-alertmanager-dns-example-com
    - name: alerts.alertmanagerConfig.slack.routes
      value:
        - channel: slack-warning-channel
          webhookURL: https://hooks.slack.com/services/some-id
          matchers:
            - name: severity
              matchType: "="
              value: "warning"
        - channel: slack-critical-channel
          webhookURL: https://hooks.slack.com/services/some-id
          matchers:
            - name: severity
              matchType: "="
              value: "critical"
    - name: alerts.alertmanagerConfig.webhook.routes
      value:
        - name: webhook-route
          url: https://some-webhook-url
          matchers:
            - name: alertname
              matchType: "=~"
              value: ".*"
    - name: alerts.alertmanager.serviceMonitor.additionalLabels
      value:
        plugin: kube-monitoring
    - name: alerts.defaultRules.create
      value: true
    - name: alerts.defaultRules.labels
      value:
        plugin: kube-monitoring
    - name: endpoint
      value: https://alertmanager.dns.example.com/api/v2
    - name: filterLabels
      value:
        - job
        - severity
        - status
    - name: silenceExcludedLabels
      value:
        - pod
        - pod_name
        - instance
```

### Deploy alerts without Alertmanager (Bring your own Alertmanager - Supernova UI only)

```yaml
apiVersion: greenhouse.sap/v1alpha1
kind: Plugin
metadata:
  name: alerts
spec:
  pluginDefinition: alerts
  disabled: false
  displayName: Alerts
  optionValues:
    - name: alerts.alertmanager.enabled
      value: false
    - name: alerts.alertmanager.ingress.enabled
      value: false
    - name: alerts.defaultRules.create
      value: false
    - name: endpoint
      value: https://alertmanager.dns.example.com/api/v2
    - name: filterLabels
      value:
        - job
        - severity
        - status
    - name: silenceExcludedLabels
      value:
        - pod
        - pod_name
        - instance
```
