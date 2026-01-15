FROM golang AS build

ARG OTEL_VERSION=0.142.0

RUN wget "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/cmd/builder/v${OTEL_VERSION}/ocb_${OTEL_VERSION}_linux_amd64" && \
    mv "ocb_${OTEL_VERSION}_linux_amd64" ocb

RUN chmod +x ./ocb
COPY otel-collector-builder-config.yaml builder-config.yaml
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 ./ocb --config builder-config.yaml

FROM debian:stable-slim

RUN apt-get update && \
    apt-get install -y systemd wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /go/dist/otelcol /usr/local/bin/otelcol
RUN chmod +x /usr/local/bin/otelcol

ENTRYPOINT ["/usr/local/bin/otelcol"]
