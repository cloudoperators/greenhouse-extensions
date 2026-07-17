{
  "policy": {
    "policy_id": "ds-{{ .stream.name }}-ism",
    "description": "Datastream ISM policy for {{ .stream.name }}: rollover, snapshot, convert to remote searchable index.",
    "schema_version": {{ .stream.schemaVersion | default 1 }},
    "default_state": "initial",
    "states": [
      {
        "name": "initial",
        "actions": [
          {
            "retry": {
              "count": 5,
              "backoff": "exponential",
              "delay": "1m"
            },
            "rollover": {
{{- if .stream.minPrimaryShardSize }}
              "min_primary_shard_size": "{{ .stream.minPrimaryShardSize }}",
{{- else }}
              "min_size": "{{ .stream.minSize }}",
{{- end }}
              "min_index_age": "{{ .stream.retention.local }}",
              "prevent_empty_rollover": true,
              "copy_alias": false
            }
          }
        ],
        "transitions": [
          {
            "state_name": "snapshot",
            "conditions": {
              "min_index_age": "{{ .stream.retention.local }}"
            }
          }
        ]
      },
      {
        "name": "snapshot",
        "actions": [
          {
            "retry": {
              "count": 3,
              "backoff": "exponential",
              "delay": "1m"
            },
            "snapshot": {
              "repository": "{{ .repo.name }}",
              "snapshot": "{_SNAPSHOT_NAME_}"
            }
          }
        ],
        "transitions": [
          {
            "state_name": "link_snapshot",
            "conditions": {
              "min_doc_count": 5
            }
          }
        ]
      },
      {
        "name": "link_snapshot",
        "actions": [
          {
            "retry": {
              "count": 3,
              "backoff": "exponential",
              "delay": "1m"
            },
            "convert_index_to_remote": {
              "repository": "{{ .repo.name }}",
              "snapshot": "{_SNAPSHOT_NAME_}",
              "rename_pattern": "{{ .stream.renamePattern | default (printf "remote_%s_$1" .stream.name) }}",
              "include_aliases": false,
              "ignore_index_settings": "index.hidden",
              "number_of_replicas": 0,
              "delete_original_index": true
            }
          }
        ],
        "transitions": []
      }
    ],
    "ism_template": [
      {
        "index_patterns": [
          "{{ .stream.name }}"
        ],
        "priority": 200
      }
    ]
  }
}
