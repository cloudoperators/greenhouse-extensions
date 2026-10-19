---
title: OTelUDPReceiveDrops / OTelUDPReceiveDropRatioHigh
weight: 20
---

# OTelUDPReceiveDrops / OTelUDPReceiveDropRatioHigh

## Problem

The kernel dropped UDP datagrams addressed to the external collector's syslog UDP receiver. The alerts use `node_netstat_Udp_InErrors`, which counts datagrams the kernel could not queue on an open socket; in practice that is almost always `RcvbufErrors` (socket receive buffer full). Datagrams for a closed port count as `NoPorts` instead. The counters come from the `udp-stats` sidecar (`openTelemetry.externalCollector.udpStatsExporter`), which reads `/proc/net/snmp` in the collector pod's network namespace.

- `OTelUDPReceiveDrops` (warning) fires as soon as one pod drops more than 100 datagrams in 15 minutes, so a single sender burst is enough.
- `OTelUDPReceiveDropRatioHigh` (warning) fires when one pod drops more than 0.1% of the UDP datagrams it received over one hour, for 15 minutes.

Loss below both thresholds (for example 5 datagrams a minute on a busy pod) does not alert; the counters still show it. Drops of IPv6 senders (`node_netstat_Udp6_InErrors`) are not alerted on.

The alerts are only rendered when `externalCollector.enabled`, `syslogConfig.enabled`, `udpStatsExporter.enabled` and `prometheus.podMonitor.enabled` are all true, and the alert names are in `prometheus.rules.enabled`.

## Impact

Every dropped datagram is one lost syslog record. The collector never saw it, so no receiver, processor or exporter metric counts it; only the kernel counters do.

## Diagnosis

- Drops per pod: `sum by (pod) (rate(node_netstat_Udp_InErrors{container="udp-stats"}[5m]))`. Compare with `node_netstat_Udp_RcvbufErrors` to confirm the cause is a full buffer. Drops are usually concentrated on the pods that receive the busiest senders, because a sender with one source port always lands on the same pod.
- UDP intake per pod: `sum by (pod) (rate(node_netstat_Udp_InDatagrams{container="udp-stats"}[5m]))`, or `otelcol_receiver_accepted_log_records_total{receiver="udp_log/syslog"}` from the collector.
- CPU of the collector container on the affected pod. A pod that sits at about one core per configured processor is at its limit.
- Receive queue on the socket at scrape time: `node_udp_queues{container="udp-stats", queue="rx"}`.
- Refused records on the same pod (`OTelExternalReceiverRefusedLogs`): a full memory_limiter also loses records, but they show up there instead.

## Resolution Steps

1. Raise `openTelemetry.externalCollector.syslogConfig.udpAsync.processors` (records are parsed in parallel, about one core each). Busy senders may need 4.
2. If drops come in bursts, raise `udpAsync.maxQueueLength`. Each slot holds a 64 KiB buffer: 5000 slots are about 313 MiB, and RSS rose by up to about 750 MiB in tests, so raise `externalCollector.resources.limits.memory` with it.
3. Some loss stays even with a large queue: in tests, back-to-back bursts sent at full line rate still lost 7 to 20% in the kernel socket buffer, with 2 or 4 processors, and the receiver cannot raise that buffer. Ask such senders to spread their bursts, or to use TCP or TLS syslog (ports 514/6514). TCP slows the sender down while the collector is busy instead of dropping datagrams, but records the pipeline refuses are still lost (see `OTelExternalReceiverRefusedLogs`).
4. If there are no `node_netstat_*` series with `container="udp-stats"`, the alerts cannot fire. Check the flags listed above and `OTelUDPStatsExporterDown`.
