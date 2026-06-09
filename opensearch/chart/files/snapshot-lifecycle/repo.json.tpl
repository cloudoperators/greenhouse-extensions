{
  "name": "{{ .repository.name }}",
  "type": "{{ .repository.type | default "s3" }}",
  "settings": {{ toJson .repository.settings }}
}
