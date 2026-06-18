# opensearch-fortlogs

Custom OpenSearch Docker image that replaces the bundled `opensearch-security-analytics` and `opensearch-alerting` plugins with patched builds containing upstream fixes not yet merged.

## Why

Upstream PRs with critical fixes are open but unmerged. This image ships those fixes by building the plugins from source branches before the patches land in an official release.

## Base image

`opensearchproject/opensearch:3.7.0` (linux/amd64)

## What this image does

1. Removes the stock `opensearch-security-analytics` and `opensearch-alerting` plugins.
2. Installs custom-built plugin ZIPs that include the patches listed below.

> **Order matters.** Do not change the order in the Dockerfile.

## Upstream PRs included

### opensearch-project/alerting

- [PRs by thecodingshrimp](https://github.com/opensearch-project/alerting/pulls/thecodingshrimp)
- [PRs by carmeroa](https://github.com/opensearch-project/alerting/pulls/carmeroa)

### opensearch-project/security-analytics

- [PRs by thecodingshrimp](https://github.com/opensearch-project/security-analytics/pulls/thecodingshrimp)
- [PRs by carmeroa](https://github.com/opensearch-project/security-analytics/pulls/carmeroa)

## Open upstream issues

| Repo | PR | Title |
|------|----|-------|
| opensearch-project/alerting | [#2163](https://github.com/opensearch-project/alerting/pull/2163) | fix: stop DestinationMigrationCoordinator cycling on unrelated cluster events |
| opensearch-project/alerting | [#2158](https://github.com/opensearch-project/alerting/pull/2158) | Fix: Skip alias-type fields in doc-level monitor query index mapping |
| opensearch-project/alerting | [#2154](https://github.com/opensearch-project/alerting/pull/2154) | fix: correct inverted condition in DocLevelMonitorQueries causing query index churn |
| opensearch-project/alerting | [#2145](https://github.com/opensearch-project/alerting/pull/2145) | Fix/workflow validation ~10 delegation monitor limit |
| opensearch-project/alerting | [#2150](https://github.com/opensearch-project/alerting/pull/2150) | Fix/doc level monitor sample documents source fields |
| opensearch-project/security-analytics | [#1726](https://github.com/opensearch-project/security-analytics/pull/1726) | fix: set deleteQueryIndexInEveryRun=false for chained_findings monitor |
| ~~opensearch-project/security-analytics~~ | [~~#1722~~](https://github.com/opensearch-project/security-analytics/pull/1722)  | ~~Fix mutable script params for detector trigger actions~~ |

## Published image
Images are built and push to ghcr.io (manual trigger of [Build Docker images and push to registry workflow](https://github.com/cloudoperators/greenhouse-extensions/actions/workflows/docker-build.yaml)). Pushed images are automatically mirrored to Keppel Container Image Registry.

## Building locally

```bash
docker build --platform linux/amd64 -t opensearch-fortlogs:3.7.0 .
```

## Removing a patch

Once an upstream PR merges and a new OpenSearch release ships the fix, remove the custom plugin from the build and bump the base image version. When all patches for a plugin are upstreamed, revert to the official plugin.