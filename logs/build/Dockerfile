# golang@1.26.0 sha256:6c2a5538f964f1c82f97ad14988bf05de100d922d159d0e398b54c7b0ca0c6c9
FROM golang@sha256:3680233e3204827fbdc66088528ae6d4b3d034f51d03a99d454f6de034888244 AS build

ARG OTEL_VERSION=0.161.0

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
