{
  "policy": {
    "policy_id": "ds-{{ .name }}-ism",
    "description": "Datastream ISM policy for {{ .name }}: rollover, snapshot to S3, convert to remote searchable index.",
    "schema_version": "{{ .schemaVersion | default 1 }}",
    "default_state": "initial",
    "states": [
      {
        "name": "initial",
        "actions": [],
        "transitions": [
          {
            "state_name": "rollover",
            "conditions": {
              "min_index_age": "{{ .retention.local }}"
            }
          },
          {
            "state_name": "rollover",
            "conditions": {
              "min_size": "{{ .minSize }}"
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
              "min_index_age": "{{ .retention.local }}"
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
              "repository": "{{ .repository.name }}",
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
              "repository": "{{ .repository.name }}",
              "snapshot": "{_SNAPSHOT_NAME_}",
              "rename_pattern": "remote_$1"
              {{- if .deleteOriginalIndex }},
              "delete_original_index": true
              {{- end }}
            }
          }
        ],
        "transitions": [
          {{- if not .deleteOriginalIndex }}
          {
            "state_name": "delete",
            "conditions": {
              "min_doc_count": 5
            }
          }
          {{- end }}
        ]
      }
      {{- if not .deleteOriginalIndex }},
      {
        "name": "delete",
        "actions": [
          {
            "retry": {
              "count": 3,
              "backoff": "exponential",
              "delay": "1m"
            },
            "delete": {}
          }
        ],
        "transitions": []
      }
      {{- end }}
    ],
    "ism_template": [
      {
        "index_patterns": [
          "{{ .indexPatterns.hot }}"
        ],
        "priority": 2
      }
    ]
  }
}
