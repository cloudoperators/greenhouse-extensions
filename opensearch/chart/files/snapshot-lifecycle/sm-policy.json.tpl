{
  "sm_policy": {
    "name": "snapshot-{{ .name }}-delete-policy",
    "description": "SM policy to delete old {{ .name }} snapshots from S3 after retention.",
    "schema_version": "{{ .schemaVersion | default 1 }}",
    "deletion": {
      "schedule": {
        "cron": {
          "expression": "{{ .smCronExpression | default "0 0 * * *" }}",
          "timezone": "{{ .smCronTimezone | default "UTC" }}"
        }
      },
      "condition": {
        "max_age": "{{ .retention.snapshot }}",
        "min_count": 1
      },
      "time_limit": "1h",
      "snapshot_pattern": "{{ .indexPatterns.hot }}"
    },
    "snapshot_config": {
      "repository": "{{ .repository.name }}"
    },
    "enabled": true
  }
}
