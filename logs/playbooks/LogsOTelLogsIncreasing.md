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

1. Identify top sources:
   - Query OpenSearch for top namespaces/pods by log count in the last 6 hours, OR
   - Use Prometheus: `topk(10, sum by (namespace, pod) (increase(otelcol_receiver_accepted_log_records[6h])))`.
1. Correlate the spike with recent deploys or config rollouts on the cluster.

## Resolution Steps

1. Silence the noisy source at the application (lower log level, verbosity flag) or add a filter processor in the collector.
1. Notify the source owner.
1. If the spike is legitimate (e.g., increased traffic), raise the queue size in collector config and notify the backend owner to adjust capacity.
