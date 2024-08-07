{{/*
 Generate config map data
 */}}
{{- define "plutono.configData" -}}
{{ include "plutono.assertNoLeakedSecrets" . }}
{{- $files := .Files }}
{{- $root := . -}}
{{- with .Values.plutono.plugins }}
plugins: {{ join "," . }}
{{- end }}
plutono.ini: |
{{- range $elem, $elemVal := index .Values.plutono "plutono.ini" }}
  {{- if not (kindIs "map" $elemVal) }}
  {{- if kindIs "invalid" $elemVal }}
  {{ $elem }} =
  {{- else if kindIs "string" $elemVal }}
  {{ $elem }} = {{ tpl $elemVal $ }}
  {{- else }}
  {{ $elem }} = {{ $elemVal }}
  {{- end }}
  {{- end }}
{{- end }}
{{- range $key, $value := index .Values.plutono "plutono.ini" }}
  {{- if kindIs "map" $value }}
  [{{ $key }}]
  {{- range $elem, $elemVal := $value }}
  {{- if kindIs "invalid" $elemVal }}
  {{ $elem }} =
  {{- else if kindIs "string" $elemVal }}
  {{ $elem }} = {{ tpl $elemVal $ }}
  {{- else }}
  {{ $elem }} = {{ $elemVal }}
  {{- end }}
  {{- end }}
  {{- end }}
{{- end }}

{{- range $key, $value := .Values.plutono.datasources }}
{{- if not (hasKey $value "secret") }}
{{ $key }}: |
  {{- tpl (toYaml $value | nindent 2) $root }}
{{- end }}
{{- end }}

{{- range $key, $value := .Values.plutono.notifiers }}
{{- if not (hasKey $value "secret") }}
{{ $key }}: |
  {{- toYaml $value | nindent 2 }}
{{- end }}
{{- end }}

{{- range $key, $value := .Values.plutono.alerting }}
{{- if (hasKey $value "file") }}
{{ $key }}:
{{- toYaml ( $files.Get $value.file ) | nindent 2 }}
{{- else if (or (hasKey $value "secret") (hasKey $value "secretFile"))}}
{{/*  will be stored inside secret generated by "configSecret.yaml"*/}}
{{- else }}
{{ $key }}: |
  {{- tpl (toYaml $value | nindent 2) $root }}
{{- end }}
{{- end }}

{{- range $key, $value := .Values.plutono.dashboardProviders }}
{{ $key }}: |
  {{- toYaml $value | nindent 2 }}
{{- end }}

{{- if .Values.plutono.dashboards  }}
download_dashboards.sh: |
  #!/usr/bin/env sh
  set -euf
  {{- if .Values.plutono.dashboardProviders }}
    {{- range $key, $value := .Values.plutono.dashboardProviders }}
      {{- range $value.providers }}
  mkdir -p {{ .options.path }}
      {{- end }}
    {{- end }}
  {{- end }}
{{ $dashboardProviders := .Values.plutono.dashboardProviders }}
{{- range $provider, $dashboards := .Values.plutono.dashboards }}
  {{- range $key, $value := $dashboards }}
    {{- if (or (hasKey $value "gnetId") (hasKey $value "url")) }}
  curl -skf \
  --connect-timeout 60 \
  --max-time 60 \
    {{- if not $value.b64content }}
      {{- if not $value.acceptHeader }}
  -H "Accept: application/json" \
      {{- else }}
  -H "Accept: {{ $value.acceptHeader }}" \
      {{- end }}
      {{- if $value.token }}
  -H "Authorization: token {{ $value.token }}" \
      {{- end }}
      {{- if $value.bearerToken }}
  -H "Authorization: Bearer {{ $value.bearerToken }}" \
      {{- end }}
      {{- if $value.basic }}
  -H "Authorization: Basic {{ $value.basic }}" \
      {{- end }}
      {{- if $value.gitlabToken }}
  -H "PRIVATE-TOKEN: {{ $value.gitlabToken }}" \
      {{- end }}
  -H "Content-Type: application/json;charset=UTF-8" \
    {{- end }}
  {{- $dpPath := "" -}}
  {{- range $kd := (index $dashboardProviders "dashboardproviders.yaml").providers }}
    {{- if eq $kd.name $provider }}
    {{- $dpPath = $kd.options.path }}
    {{- end }}
  {{- end }}
  {{- if $value.url }}
    "{{ $value.url }}" \
  {{- else }}
    "https://plutono.com/api/dashboards/{{ $value.gnetId }}/revisions/{{- if $value.revision -}}{{ $value.revision }}{{- else -}}1{{- end -}}/download" \
  {{- end }}
  {{- if $value.datasource }}
    {{- if kindIs "string" $value.datasource }}
    | sed '/-- .* --/! s/"datasource":.*,/"datasource": "{{ $value.datasource }}",/g' \
    {{- end }}
    {{- if kindIs "slice" $value.datasource }}
      {{- range $value.datasource }}
        | sed '/-- .* --/! s/${{"{"}}{{ .name }}}/{{ .value }}/g' \
      {{- end }}
    {{- end }}
  {{- end }}
  {{- if $value.b64content }}
    | base64 -d \
  {{- end }}
  > "{{- if $dpPath -}}{{ $dpPath }}{{- else -}}/var/lib/plutono/dashboards/{{ $provider }}{{- end -}}/{{ $key }}.json"
    {{ end }}
  {{- end }}
{{- end }}
{{- end }}
{{- end -}}

{{/*
 Generate dashboard json config map data
 */}}
{{- define "plutono.configDashboardProviderData" -}}
provider.yaml: |-
  apiVersion: 1
  providers:
    - name: '{{ .Values.plutono.sidecar.dashboards.provider.name }}'
      orgId: {{ .Values.plutono.sidecar.dashboards.provider.orgid }}
      {{- if not .Values.plutono.sidecar.dashboards.provider.foldersFromFilesStructure }}
      folder: '{{ .Values.plutono.sidecar.dashboards.provider.folder }}'
      folderUid: '{{ .Values.plutono.sidecar.dashboards.provider.folderUid }}'
      {{- end }}
      type: {{ .Values.plutono.sidecar.dashboards.provider.type }}
      disableDeletion: {{ .Values.plutono.sidecar.dashboards.provider.disableDelete }}
      allowUiUpdates: {{ .Values.plutono.sidecar.dashboards.provider.allowUiUpdates }}
      updateIntervalSeconds: {{ .Values.plutono.sidecar.dashboards.provider.updateIntervalSeconds | default 30 }}
      options:
        foldersFromFilesStructure: {{ .Values.plutono.sidecar.dashboards.provider.foldersFromFilesStructure }}
        path: {{ .Values.plutono.sidecar.dashboards.folder }}{{- with .Values.plutono.sidecar.dashboards.defaultFolderName }}/{{ . }}{{- end }}
{{- end -}}

{{- define "plutono.secretsData" -}}
{{- if and (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) (not .Values.plutono.admin.existingSecret) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) }}
admin-user: {{ .Values.plutono.adminUser | b64enc | quote }}
{{- if .Values.plutono.adminPassword }}
admin-password: {{ .Values.plutono.adminPassword | b64enc | quote }}
{{- else }}
admin-password: {{ include "plutono.password" . }}
{{- end }}
{{- end }}
{{- if not .Values.plutono.ldap.existingSecret }}
ldap-toml: {{ tpl .Values.plutono.ldap.config $ | b64enc | quote }}
{{- end }}
{{- end -}}
