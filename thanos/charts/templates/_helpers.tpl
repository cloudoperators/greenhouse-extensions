{{/*
Generic plugin name
*/}}
{{- define "release.name" -}}
{{- printf "%s" $.Release.Name | trunc 50 | trimSuffix "-" -}}
{{- end}}

{{/* Generate plugin specific labels */}}
{{- define "plugin.labels" -}}
plugindefinition: thanos 
plugin: {{ $.Release.Name }}
{{- if .Values.global.commonLabels }}
{{ tpl (toYaml .Values.global.commonLabels) . }}
{{- end }}
{{- end }}

{{/* Base labels to be glued on everything */}}
{{- define "thanos.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
release: {{ $.Release.Name | quote }}
{{- end }}

{{/* Object Store Secret Name */}}
{{- define "thanos.objectStoreSecretName" -}}
{{- if .Values.thanos.existingObjectStoreSecret.name -}}
{{ tpl .Values.thanos.existingObjectStoreSecret.name . }}
{{- else -}}
kube-monitoring-prometheus
{{- end }}
{{- end }}

{{/* Object Store Config File Name */}}
{{- define "thanos.objectStoreConfigFile" -}}
{{- if .Values.thanos.existingObjectStoreSecret.configFile -}}
{{ tpl .Values.thanos.existingObjectStoreSecret.configFile . }}
{{- else -}}
object-storage-configs.yaml
{{- end }}
{{- end }}

{{- define "thanos.annotations" -}}
{{- if or .base .service }}
annotations:
{{- with .base }}
{{- toYaml . | nindent 2 }}
{{- end }}
{{- with .service }}
{{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Discover other Thanos Query instances in the cluster.
Returns a list of endpoints (host:port) for other Thanos queries with GRPC ingress enabled.
*/}}
{{- define "thanos.discoverOtherQueries" -}}
{{- $currentPluginName := .Release.Name -}}
{{- $discoveredEndpoints := list -}}

{{- if .Values.thanos.query.discoverOtherQueries -}}
  {{- /* Lookup all Plugin CRs cluster-wide */ -}}
  {{- $plugins := lookup "greenhouse.sap/v1alpha1" "Plugin" "" "" -}}

  {{- if $plugins -}}
    {{- range $plugin := $plugins.items -}}
      {{- /* Filter: must be a thanos plugin */ -}}
      {{- if eq (get $plugin.spec "pluginDefinition") "thanos" -}}

        {{- /* Filter: must not be disabled */ -}}
        {{- $isDisabled := get $plugin.spec "disabled" | default false -}}
        {{- if not $isDisabled -}}

          {{- /* Filter: must not be the current plugin */ -}}
          {{- if ne $plugin.metadata.name $currentPluginName -}}

            {{- /* Filter: check greenhouse.sap/thanos-discovery label (default true if not set) */ -}}
            {{- $labels := get $plugin.metadata "labels" | default dict -}}
            {{- $discoveryEnabled := get $labels "greenhouse.sap/thanos-discovery" | default "true" -}}
            {{- if ne $discoveryEnabled "false" -}}

              {{- /* Check if GRPC ingress is enabled and has hosts */ -}}
              {{- $optionValues := get $plugin.spec "optionValues" | default list -}}
              {{- $grpcEnabled := false -}}
              {{- $grpcHost := "" -}}

              {{- /* Find thanos.query.ingress.grpc.enabled option */ -}}
              {{- range $option := $optionValues -}}
                {{- if eq $option.name "thanos.query.ingress.grpc.enabled" -}}
                  {{- $grpcEnabled = $option.value -}}
                {{- end -}}
              {{- end -}}

              {{- /* Find thanos.query.ingress.grpc.hosts option */ -}}
              {{- if $grpcEnabled -}}
                {{- range $option := $optionValues -}}
                  {{- if eq $option.name "thanos.query.ingress.grpc.hosts" -}}
                    {{- if $option.value -}}
                      {{- $hosts := $option.value -}}
                      {{- if gt (len $hosts) 0 -}}
                        {{- $firstHost := index $hosts 0 -}}
                        {{- $grpcHost = get $firstHost "host" | default "" -}}
                      {{- end -}}
                    {{- end -}}
                  {{- end -}}
                {{- end -}}
              {{- end -}}

              {{- /* If we found a valid GRPC host, add it to discovered endpoints */ -}}
              {{- if $grpcHost -}}
                {{- $endpoint := printf "%s:443" $grpcHost -}}
                {{- $discoveredEndpoints = append $discoveredEndpoints $endpoint -}}
              {{- end -}}

            {{- end -}}
          {{- end -}}
        {{- end -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- /* Return the list of discovered endpoints */ -}}
{{- $discoveredEndpoints | toJson -}}
{{- end -}}
