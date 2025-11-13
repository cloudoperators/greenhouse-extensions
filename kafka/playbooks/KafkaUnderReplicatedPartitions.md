# KafkaUnderReplicatedPartitions

## Summary

This alert fires when Kafka has under-replicated partitions for more than 15 minutes.

## Steps to Debug

1. Check broker status and logs for any issues
2. Verify network connectivity between brokers
3. Check if any brokers are under high load
4. Review partition reassignment status
