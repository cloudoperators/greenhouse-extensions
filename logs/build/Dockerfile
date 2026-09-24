# golang@1.26.0 sha256:6c2a5538f964f1c82f97ad14988bf05de100d922d159d0e398b54c7b0ca0c6c9
FROM golang@sha256:6c2a5538f964f1c82f97ad14988bf05de100d922d159d0e398b54c7b0ca0c6c9 AS build

ARG OTEL_VERSION=0.161.0

RUN wget "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/cmd/builder/v${OTEL_VERSION}/ocb_${OTEL_VERSION}_linux_amd64" && \
    mv "ocb_${OTEL_VERSION}_linux_amd64" ocb

RUN chmod +x ./ocb
COPY otel-collector-builder-config.yaml builder-config.yaml
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 ./ocb --config builder-config.yaml

FROM ubuntu@sha256:da6fc2be547864451aa253836dd926da33623312df4a9a243e35dc877c378a78

RUN apt-get update && \
    apt-get install -y --no-install-recommends systemd wget ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /go/dist/otelcol /usr/local/bin/otelcol
RUN chmod +x /usr/local/bin/otelcol

ENTRYPOINT ["/usr/local/bin/otelcol"]
