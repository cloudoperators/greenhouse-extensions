# Device Migration Tracking Dashboards

## Summary

Devices currently send logs to FortLogs OpenSearch through Logstash (Octobus). There are two paths, each identifiable by a field in the ingested logs:

| Path | Identifying field |
| --- | --- |
| Logstash TCP | `attributes.forwarded_by: octobus_logstash` |
| Logstash HTTP (structured) | `attributes.sap.ocb.input.name: in-syslog-logstash` |

The target state is direct ingestion: device owners migrate their devices to send logs straight to FortLogs OpenSearch, removing the Logstash hop entirely. Logs from devices that have already migrated contain neither of the fields above.

These OpenSearch Dashboards saved-object bundles provide a migration progress dashboard for the team and device owners to:

- See the current split between Logstash-forwarded and direct ingestion, both by log volume and by device count.
- Track the trend over time; the share of direct ingestion should grow as devices migrate.
- Identify which devices are still routing through Logstash and have not yet migrated.
- Confirm a device has migrated successfully by observing its logs appear under direct ingestion.

## Bundles

| File | Index pattern |
| --- | --- |
| `device_migration_tracking_logs.ndjson` | `syslog,remote_syslog_*` |
| `device_migration_tracking_audit.ndjson` | `syslog-audit,remote_syslog-audit_*` |

Both bundles contain the `DEV - Device Migration Tracking Dashboard` dashboard with panels for log types and volume, Octobus vs FortLogs traffic (current split and trend), and a device table showing per-device status.
