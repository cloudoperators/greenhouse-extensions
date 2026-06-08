{
  "policy": {
    "policy_id": "remote-{{ .name }}-ism",
    "description": "ISM policy for {{ .name }} searchable snapshot indices: delete after retention.",
    "schema_version": "{{ .schemaVersion | default 1 }}",
    "default_state": "initial",
    "states": [
      {
        "name": "initial",
        "actions": [
          {
            "retry": {
              "count": 3,
              "backoff": "exponential",
              "delay": "1m"
            },
            "replica_count": {
              "number_of_replicas": 0
            }
          }
        ],
        "transitions": [
          {
            "state_name": "delete",
            "conditions": {
              "min_index_age": "{{ .retention.remote }}"
            }
          }
        ]
      },
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
    ],
    "ism_template": [
      {
        "index_patterns": [
          "{{ .indexPatterns.remote }}"
        ],
        "priority": 2
      }
    ]
  }
}
