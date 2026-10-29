---
title: OTelLogsExportFailureRatioHigh
weight: 20
---

# OTelLogsExportFailureRatioHigh

## Problem

More than 10% of log export attempts are failing for a specific exporter over the last 10 minutes. The `exporter` label in the alert identifies which failover leg is affected.

## Impact

Log records destined for the failing exporter are not being delivered. If both failover legs fail simultaneously, the queue will fill and the pipeline will stall.

## Diagnosis

1. Inspect collector logs for export errors on the `exporter` label: timeouts, 4xx/5xx responses, auth failures.
1. Check sink health (OpenSearch/Kafka) and credentials in the mounted secret.

## Resolution Steps

1. Fix the sink or rotate credentials for the failing leg.
1. If one leg is down, failover should carry traffic; verify both legs.
1. Restart collector only if config/secret change needs to be picked up.
