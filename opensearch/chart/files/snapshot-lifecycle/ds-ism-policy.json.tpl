{
  "policy": {
    "policy_id": "ds-{{ .stream.name }}-ism",
    "description": "Datastream ISM policy for {{ .stream.name }}: rollover, snapshot, convert to remote searchable index.",
    "schema_version": {{ .stream.schemaVersion | default 1 }},
    "default_state": "initial",
    "states": [
      {
        "name": "initial",
        "actions": [],
        "transitions": [
          {
            "state_name": "rollover",
            "conditions": {
              "min_index_age": "{{ .stream.retention.local }}"
            }
          },
          {
            "state_name": "rollover",
            "conditions": {
              "min_size": "{{ .stream.minSize }}"
            }
          }
        ]
      },
      {
        "name": "rollover",
        "actions": [
          {
            "retry": {
              "count": 5,
              "backoff": "exponential",
              "delay": "1m"
            },
            "rollover": {
              "min_doc_count": 5,
              "min_index_age": "1d",
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
            "timeout": "10h",
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
            "timeout": "3h",
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
