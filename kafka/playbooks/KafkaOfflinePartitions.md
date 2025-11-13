# KafkaOfflinePartitions

## Summary

This alert fires when Kafka has offline partitions for more than 5 minutes.

## Steps to Debug

1. Check which topics have offline partitions
2. Review broker logs for errors
3. Verify storage and disk space availability
4. Check for controller election issues
