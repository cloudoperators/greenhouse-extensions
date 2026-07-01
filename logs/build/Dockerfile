FROM golang@sha256:f96cc555eb8db430159a3aa6797cd5bae561945b7b0fe7d0e284c63a3b291609 AS build

ARG OTEL_VERSION=0.152.0

RUN wget "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/cmd/builder/v${OTEL_VERSION}/ocb_${OTEL_VERSION}_linux_amd64" && \
    mv "ocb_${OTEL_VERSION}_linux_amd64" ocb

RUN chmod +x ./ocb
COPY otel-collector-builder-config.yaml builder-config.yaml
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 ./ocb --config builder-config.yaml

FROM ubuntu@sha256:786a8b558f7be160c6c8c4a54f9a57274f3b4fb1491cf65146521ae77ff1dc54

RUN apt-get update && \
    apt-get install -y --no-install-recommends systemd wget ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /go/dist/otelcol /usr/local/bin/otelcol
RUN chmod +x /usr/local/bin/otelcol

ENTRYPOINT ["/usr/local/bin/otelcol"]
