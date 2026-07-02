FROM golang@sha256:c138bff780910acf4254ab3a6f7ff0f64bbd841f27bd82bfa986fe122c109538 AS build

ARG OTEL_VERSION=0.152.0

RUN wget "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/cmd/builder/v${OTEL_VERSION}/ocb_${OTEL_VERSION}_linux_amd64" && \
    mv "ocb_${OTEL_VERSION}_linux_amd64" ocb

RUN chmod +x ./ocb
COPY otel-collector-builder-config.yaml builder-config.yaml
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 ./ocb --config builder-config.yaml

FROM ubuntu@sha256:b7f48194d4d8b763a478a621cdc81c27be222ba2206ca3ca6bc42b49685f3d9e

RUN apt-get update && \
    apt-get install -y --no-install-recommends systemd wget ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /go/dist/otelcol /usr/local/bin/otelcol
RUN chmod +x /usr/local/bin/otelcol

ENTRYPOINT ["/usr/local/bin/otelcol"]
