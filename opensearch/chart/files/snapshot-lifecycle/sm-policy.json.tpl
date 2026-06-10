{
  "sm_policy": {
    "name": "snapshot-{{ .stream.name }}-delete-policy",
    "description": "SM policy to delete old {{ .stream.name }} snapshots after retention.",
    "schema_version": {{ .stream.schemaVersion | default 1 }},
    "deletion": {
      "schedule": {
        "cron": {
          "expression": "{{ .stream.smCronExpression | default "0 0 * * *" }}",
          "timezone": "{{ .stream.smCronTimezone | default "UTC" }}"
        }
      },
      "condition": {
        "max_age": "{{ .stream.retention.snapshot }}",
        "min_count": 1
      },
      "time_limit": "1h",
      "snapshot_pattern": "{{ .stream.indexPatterns.hot }}"
    },
    "snapshot_config": {
      "repository": "{{ .repo.name }}"
    },
    "enabled": true
  }
}
