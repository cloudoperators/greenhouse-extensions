# Updating the OpenTelemetry Collector Contrib Image

This document describes how the custom OpenTelemetry Collector contrib image is built, published, and updated across the logs plugin.

## Architecture Overview

We maintain a **fork** of the upstream OpenTelemetry Collector contrib at [cloudoperators/opentelemetry-collector-contrib](https://github.com/cloudoperators/opentelemetry-collector-contrib). This fork contains custom components e.g., `auditdreceiver` that are not part of the upstream distribution.

The custom collector image is built in the **greenhouse-extensions** repository using the [OpenTelemetry Collector Builder (ocb)](https://github.com/open-telemetry/opentelemetry-collector-releases). The builder config references both upstream modules and our fork's modules.

```
┌─────────────────────────────────────┐
│  cloudoperators/                    │
│  opentelemetry-collector-contrib    │
│  (fork with custom components)      │
│                                     │
│  - receiver/auditdreceiver          │
│  - exporter/kafkaexporter           │
└──────────────┬──────────────────────┘
               │ go module references
               ▼
┌─────────────────────────────────────┐
│  greenhouse-extensions/logs/build/  │
│                                     │
│  otel-collector-builder-config.yaml │
│  Dockerfile                         │
└──────────────┬──────────────────────┘
               │ CI pipeline builds & pushes
               ▼
┌─────────────────────────────────────┐
│  ghcr.io/cloudoperators/            │
│  opentelemetry-collector-contrib    │
│  (tagged by commit SHA)             │
└──────────────┬──────────────────────┘
               │ referenced by Helm values
               ▼
┌─────────────────────────────────────┐
│  logs/charts/values.yaml            │
│  openTelemetry.collectorImage.tag   │
└─────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `logs/build/Dockerfile` | Multi-stage build: downloads `ocb`, compiles the collector |
| `logs/build/otel-collector-builder-config.yaml` | Declares all receivers, processors, exporters, etc. |
| `logs/charts/values.yaml` | Helm values with `openTelemetry.collectorImage.repository` and `.tag` |
| `logs/plugindefinition.yaml` | Plugin definition exposing the image config as options |
| `.github/workflows/docker-build.yaml` | CI pipeline that builds and publishes the image |

## How the Image is Built

The Dockerfile uses a two-stage build:

1. **Build stage** (golang) -- downloads `ocb` for the configured `OTEL_VERSION`, then compiles the collector binary from `otel-collector-builder-config.yaml`.
2. **Runtime stage** (debian:stable-slim) -- copies the compiled binary and sets it as the entrypoint.

The builder config (`otel-collector-builder-config.yaml`) pulls most components from upstream `open-telemetry/opentelemetry-collector-contrib` and two from our fork `cloudoperators/opentelemetry-collector-contrib`:

## CI Pipeline

The GitHub Actions workflow at `.github/workflows/docker-build.yaml` triggers on:

- **Push to `main`** (when `Dockerfile.*` paths change)
- **Git tags** matching `v*.*.*`
- **Manual dispatch**

It builds the image for `linux/amd64`, pushes to `ghcr.io/cloudoperators/opentelemetry-collector-contrib`, and generates tags including the full commit SHA and a short SHA. After the build, the image is signed with cosign and scanned for vulnerabilities with Trivy.

## Step-by-Step: Updating the Image

### 1. Update the Fork (if needed)

If you need to pull in upstream changes or modify custom components:

```bash
cd opentelemetry-collector-contrib   # the fork
git fetch upstream
git merge upstream/main              # or rebase onto the target release tag
# resolve conflicts, test, push
```

After pushing changes to the fork, create a new **tag** (e.g., `v0.148.1`) so the Go module version is resolvable.

### 2. Update the Builder Config

Edit `logs/build/otel-collector-builder-config.yaml`:

- **Bump upstream versions** -- change `v0.147.0` to the new version for all `open-telemetry/opentelemetry-collector-contrib` and `go.opentelemetry.io/collector` modules.
- **Bump fork versions** -- change `v0.147.1` to the new tag for `cloudoperators/opentelemetry-collector-contrib` modules.
- **Add or remove components** as needed.

### 3. Update the Dockerfile (if needed)

If the `ocb` builder version needs to change, update the `OTEL_VERSION` ARG in `logs/build/Dockerfile`:

```dockerfile
ARG OTEL_VERSION=0.148.0
```

Also update the base image digests if there are newer versions of `golang` or `debian:stable-slim`.

### 4. Build and Push the Image

Push your changes to `main` or trigger the pipeline manually:

- The CI pipeline builds the image and pushes it to `ghcr.io/cloudoperators/opentelemetry-collector-contrib`.
- The image is tagged with the commit SHA (e.g., `a1b2c3d`).
- Note the short SHA from the pipeline output -- you need it for the next step.

### 5. Update the Helm Chart

Update the image tag in `logs/charts/values.yaml`:

```yaml
openTelemetry:
  collectorImage:
    repository: ghcr.io/cloudoperators/opentelemetry-collector-contrib
    tag: "a1b2c3d"  # <-- new commit SHA
```

Also update `logs/plugindefinition.yaml` if the default image tag is referenced there, and bump the chart/plugin versions as appropriate.

### 6. Update the Audit-Logs Plugin (if applicable)

The `audit-logs/` plugin uses the same image. Update `audit-logs/charts/values.yaml` and `audit-logs/plugindefinition.yaml` with the same new tag.

## Version Conventions

- **Upstream modules**: Use the upstream release version (e.g., `v0.147.0`).
- **Fork modules**: Use a version one patch higher (e.g., `v0.147.1`) to distinguish from upstream while staying in the same minor range.
- **Image tags in Helm**: Short commit SHA from the CI build (e.g., `58b73f4`).
- **ocb version**: Matches the upstream collector release version.

## Troubleshooting

- **Go module resolution errors**: Make sure the fork has a proper git tag matching the version in the builder config. Go modules require tags in `vX.Y.Z` format.
- **Build failures**: Check that all module versions are compatible. Mixing versions across the `v0.147.0` / `v1.52.0` boundary requires matching the collector core version matrix.
- **Image not found**: Verify the CI pipeline ran successfully and the image exists at `ghcr.io/cloudoperators/opentelemetry-collector-contrib:<sha>`.
