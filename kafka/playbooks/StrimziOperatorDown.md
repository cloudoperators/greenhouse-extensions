# StrimziOperatorDown

## Summary

This alert fires when the Strimzi Kafka Operator is down for more than 10 minutes.

## Steps to Debug

1. Check operator pod status:
   ```bash
   kubectl get pods -l app.kubernetes.io/name=strimzi-cluster-operator
   ```

2. Check operator logs:
   ```bash
   kubectl logs -l app.kubernetes.io/name=strimzi-cluster-operator
   ```

3. Verify operator deployment:
   ```bash
   kubectl get deployment -l app.kubernetes.io/name=strimzi-cluster-operator
   ```
