## Supernova

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Built with Juno](https://cloudoperators.github.io/juno/built-with-juno.svg)](https://github.com/cloudoperators/juno)

Supernova is an alternative UI for Prometheus Alertmanager with some quality of life improvements:

- Micro frontend design based on `Juno UI components`
- Predefined filter categories
- Easy filtering
- Autodiscover of the support group and added automatically as filter
- Aggregation and counting of alerts by region and severity
- Automatic URL linking for URLs in descriptions
- Parsing of alert labels for included external links
- Display of active and expired silences for a given alert
- Warning of an existing silence displaying the exact expiration time when creating new silences

## Concepts

### Alerts

Alerting rules offer the capability to define alert conditions using expressions in the Prometheus expression language. These rules enable you to specify conditions that trigger alerts, and subsequently send notifications regarding the firing alerts to an external service. Whenever the alert expression results in one or more vector elements at a given point in time, the alert counts as active for these elements `label sets`.

#### Labels

The labels clause allows specifying a set of additional labels to be attached to the alert. Following is a live example of a set of labels from an alert of the `support group:containers` with `severity:info` in the `region:eu-de-2`.

```js
{
  ...
  "labels": {
    "alertname": "PodOOMKilled",
    "cluster": "eu-de-2",
    "cluster_type": "metal",
    "context": "memory",
    "label_ccloud_support_group": "containers",
    "meta": "Pod kube-system/kube-system-metal-owner-label-injector-28150200-2vgk5 OOMKilled",
    "namespace": "kube-system",
    "no_alert_on_absence": "true",
    "playbook": "docs/support/playbook/kubernetes/k8s_pod_oomkilled",
    "pod_name": "kube-system-metal-owner-label-injector-28150200-2vgk5",
    "prometheus": "kube-monitoring/kubernetes",
    "region": "eu-de-2",
    "service": "resources",
    "severity": "info",
    "support_group": "containers",
    "tier": "k8s",
    "status": "active"
  }
  ...
}
```

### Silences

Silences are a straightforward way to simply mute alerts for a given time. A silence is configured based on matchers. Incoming alerts are checked whether they match all the equality matchers of an active silence. If they do, no notifications will be sent out for that alert.

#### Matchers

A matcher is a string with a syntax inspired by PromQL and OpenMetrics. Matchers are ANDed together, meaning that all matchers must evaluate to "true" when tested against the labels on a given alert.

When utilizing Supernova to add a silence, the matchers will be preselected based on the alert you selected. Moreover, through the advanced section, you have the option to include additional labels that are excluded by default. These exclusions are dependent on the configured excluded labels, which will be explained in detail in the section below.

Given an alert with following labels:

```js
{
  ...
  fingerprint: "alert123",
  labels: {
    severity: "critical",
    support_group: "containers",
    service: "automation",
  }
  ...
}
```

In order to prevent the alert from continuing to trigger, we require a silence that includes the following matchers:

```js
{
  ...
  id: "silence123",
  matchers: [
    { name: "severity", value: "critical" },
    { name: "support_group", value: "containers" },
    { name: "service", value: "automation" },
  ],
  ...
}
```

## Configuration

### Filter labels

Filter labels are a set of labels that are utilized to define the criteria by which alerts will be filtered, if those labels exist within the fetched alerts. These filter labels enable you to selectively narrow down the alerts based on specific label values, resulting in a more targeted and refined alert filtering process.

To set the filter labels:

1. Utilize the app prop `filterLabels`, which is used during the setup of the script tag.

### Silence excluded alert labels

Excluded labels are a collection of labels that are automatically excluded by default when configuring silence matchers. These labels, such as `pod`, `pod_name` or `instance`, often undergo frequent value changes, causing new alerts to be triggered that are not covered by the existing silence.

Consider the following example: an alert is triggered when a pod runs out of memory and gets killed `Out Of Memory killed`. When this pod is recreated, it receives a different name. If the pod runs again out of memory because of the same issue, a new alarm will be triggered, but it won't be covered if we had used the `pod_name` as a matcher in the silence configuration.

PodOOMKilled alarm labels example:

```js
{
  "alertname": "PodOOMKilled",
  "cluster": "eu-de-1",
  "cluster_type": "metal",
  "context": "memory",
  "label_ccloud_service": "keppel",
  "label_ccloud_support_group": "containers",
  "meta": "Pod keppel/keppel-janitor-6dc777bcbf-5xrns OOMKilled",
  "namespace": "keppel",
  "no_alert_on_absence": "true",
  "playbook": "docs/support/playbook/kubernetes/k8s_pod_oomkilled",
  "pod_name": "keppel-janitor-6dc777bcbf-5xrns",
  "prometheus": "kube-monitoring/kubernetes",
  "region": "eu-de-1",
  "service": "resources",
  "severity": "info",
  "support_group": "containers",
  "tier": "k8s",
  "status": "active"
}
```

If the end user wishes to include any excluded labels as matchers, they can easily do so by expanding the advanced section during the silence creation process. This allows for greater flexibility and customization when configuring the silence matchers.

To set the excluded alert labels:

1. Utilize the app prop `silenceExcludedLabels`, which is used during the setup of the script tag.

### Theme

Set this attribute to specify a custom theme for your application. Possible values are `"theme-light"` or `"theme-dark"` (default)

To set the theme:

1. Utilize the app prop `theme`, which is used during the setup of the script tag.

### Endpoint

Sets the Alertmanager API Endpoint URL. Provide the full URL of the Alertmanager API endpoint to which the application will connect.

To set the endpoint:

1. Utilize the app prop `endpoint`, which is used during the setup of the script tag.

### Predefined Filters

Specifies filters to be applied in the UI for distinguishing between contexts by matching alerts with regular expressions. These filters are automatically loaded when the application starts. The format is a list of objects including name, displayname and matchers (containing keys corresponding value).

Example:

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

To set the predefined Filter:

1. Utilize the app prop `predefinedFilters`, which is used during the setup of the script tag.

### Silence Templates

Defines pre-configured silences available in the schedule silence modal for setting up maintenance windows. The format consists of a list of objects including description, editable_labels (array of strings specifying the labels that users can modify), fixed_labels (map containing fixed labels and their corresponding values), status, and title.

Example:

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

To set the silence templates:

1. Utilize the app prop `silenceTemplates`, which is used during the setup of the script tag.
