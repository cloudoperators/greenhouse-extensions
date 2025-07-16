---
title: OpenSearchOperatorHighCPUUsage
weight: 20
---

# OpenSearchOperatorHighCPUUsage

## Problem

The OpenSearch operator is experiencing high CPU usage, which can lead to performance degradation and potential issues with cluster management.

## Impact

- Reduced operator performance and responsiveness
- Potential delays in cluster management operations
- Increased resource consumption
- Risk of operator instability if CPU usage remains high

## Diagnosis

1. **Check operator CPU usage**: Monitor CPU usage of the operator pods:
   ```bash
   kubectl top pods -n opensearch-system
   ```

2. **Check operator logs**: Look for any errors or warnings in the operator logs:
   ```bash
   kubectl logs -n opensearch-system deployment/opensearch-operator-controller-manager
   ```

3. **Check for reconciliation loops**: Look for any reconciliation loops or repeated operations that might be consuming high CPU.

4. **Monitor operator metrics**: Check if there are any metrics available for the operator to understand its behavior.

## Resolution Steps

1. **Identify high CPU processes**: Check which operations are consuming high CPU in the operator:
   ```bash
   kubectl logs -n opensearch-system deployment/opensearch-operator-controller-manager --tail=100
   ```

2. **Check for reconciliation issues**: If high CPU is due to reconciliation loops:
   - Review OpenSearch cluster configurations
   - Check for any conflicting configurations
   - Ensure that cluster resources are properly defined

3. **Scale operator resources**: If CPU usage is consistently high:
   - Increase CPU limits for the operator deployment
   - Consider scaling the operator horizontally if supported
   - Monitor resource usage patterns

4. **Optimize operator configuration**: Review and optimize the operator configuration:
   - Check reconciliation intervals
   - Review resource limits and requests
   - Ensure proper resource allocation

5. **Monitor and adjust**: Continue monitoring CPU usage and adjust resources as needed.

6. **Contact support**: If issues persist, investigate further or seek assistance from your operations team.
