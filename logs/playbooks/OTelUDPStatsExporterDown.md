---
title: OTelUDPStatsExporterDown
weight: 20
---

# OTelUDPStatsExporterDown

## Problem

Prometheus could not scrape the `udp-stats` sidecar of an external collector pod for 10 minutes (`up{container="udp-stats"} == 0`, or a crash loop that answers only now and then).

## Impact

- `OTelUDPReceiveDrops` and `OTelUDPReceiveDropRatioHigh` have no data for this pod, so UDP syslog loss there goes unnoticed.
- The sidecar is a regular container. While it is not running (image pull failure, crash loop, OOM kill), the collector pod is NotReady and out of the Service, so it receives no syslog at all.

## Diagnosis

- `kubectl get pod <pod>` and `kubectl describe pod <pod>`: look at the state of the `udp-stats` container (ImagePullBackOff, CrashLoopBackOff, OOMKilled) and at the events.
- `kubectl logs <pod> -c udp-stats --previous` for a crash.
- If the container is running, check that port `udp-stats` answers on `/metrics` and that no NetworkPolicy blocks Prometheus.

## Resolution Steps

1. Image pull failure: point `openTelemetry.externalCollector.udpStatsExporter.image.repository` at a registry mirror the cluster can always pull from.
2. OOM kill: raise `udpStatsExporter.resources.limits.memory`.
3. If the sidecar cannot be fixed quickly, set `udpStatsExporter.enabled: false` to get the collector pods Ready again. The UDP drop alerts stop until it is back.
