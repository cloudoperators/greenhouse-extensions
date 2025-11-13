# KafkaBrokerDown

## Summary

This alert fires when a Kafka broker is down for more than 10 minutes.

## Steps to Debug

1. Check the pod status:
   ```bash
   kubectl get pods -l strimzi.io/cluster=<cluster-name>
   ```

2. Check pod logs:
   ```bash
   kubectl logs <pod-name>
   ```

3. Check operator logs:
   ```bash
   kubectl logs -l app.kubernetes.io/name=strimzi-cluster-operator
   ```

4. Verify cluster status:
   ```bash
   kubectl get kafka <cluster-name> -o yaml
   ```
