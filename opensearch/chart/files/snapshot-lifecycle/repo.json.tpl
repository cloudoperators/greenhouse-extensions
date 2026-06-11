{
  "name": "{{ .repo.name }}",
  "type": "{{ .repo.type | default "s3" }}",
  "settings": {{ toJson (.repo.settings | default dict) }}
}
