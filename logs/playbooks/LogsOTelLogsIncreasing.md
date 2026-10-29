---
title: Logs are Increasing
weight: 20
---

# OTelLogsIncreasing

## Problem

Logs on the affected cluster have significantly increased over the last 6 hours (4x the baseline from 2 hours before). This may indicate a logging misconfiguration, a noisy application, or a log injection attempt.

## Impact

High log volume may saturate the sending queue, increase storage cost in OpenSearch, and crowd out signal from other sources on the same node.

## Diagnosis

1. Identify top sources via OpenSearch
1. or `otelcol_receiver_accepted_log_records` by `receiver` / namespace / pod.
1. Correlate the spike with recent deploys or config rollouts on the cluster.

## Resolution Steps

1. Silence the noisy source at the application (log level, verbosity flag) or filter it in the collector.
1. If the spike is legitimate, raise the queue size and notify the backend owner so capacity can be adjusted.
