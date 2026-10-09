# Updating the OpenTelemetry Collector Operator Image

This document describes how the custom OpenTelemetry Operator image is managed for the logs plugin.

## Key Files

| File | Purpose |
|------|---------|
| `logs/charts/charts/crds/crds` | Contains CRDs needed by the opentelemetry operator |
| `logs/charts/values.yaml` | Helm values with `opentelemetry-operator:.manager.image` |

## CI Pipeline

## Step-by-Step: Updating the Image

# 1. Set the correct values.yaml

The updating of the image itself is simple enough:
```
    image:
    # -- overrides the default image repository for the OpenTelemetry Operator image.
      repository: ghcr.io/open-telemetry/opentelemetry-operator/opentelemetry-operator
    # @ignored renovate does not support generating new README.md
    # -- overrides the default tag repository for the OpenTelemetry Operator image.
      tag: [image-tag]
```
Just specify a valid `image-tag` from the repository.

> Note: The operator and the collectors are different images, version tags need not be the same.

# 2. Update CRDs to the correct version.

CRDs should be updated to match the tag of the operator. Otherwise there might be some problems with deploying any OpenTelemetry CR.
