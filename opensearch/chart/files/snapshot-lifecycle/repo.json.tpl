{
  "name": "{{ .repository.name }}",
  "type": "{{ .repository.type | default "s3" }}",
  "settings": {
    "bucket": "{{ .repository.bucket }}",
    "base_path": "{{ .repository.basePath }}",
    "client": "{{ .repository.client }}"
  }
}
