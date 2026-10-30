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

## Resolution Steps
