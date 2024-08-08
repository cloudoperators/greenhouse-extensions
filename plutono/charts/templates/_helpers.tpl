{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "plutono.name" -}}
{{- default .Chart.Name .Values.plutono.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "plutono.fullname" -}}
{{- if .Values.plutono.fullnameOverride }}
{{- .Values.plutono.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.plutono.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "plutono.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the name of the service account
*/}}
{{- define "plutono.serviceAccountName" -}}
{{- if .Values.plutono.serviceAccount.create }}
{{- default (include "plutono.fullname" .) .Values.plutono.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.plutono.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "plutono.serviceAccountNameTest" -}}
{{- if .Values.plutono.serviceAccount.create }}
{{- default (print (include "plutono.fullname" .) "-test") .Values.plutono.serviceAccount.nameTest }}
{{- else }}
{{- default "default" .Values.plutono.serviceAccount.nameTest }}
{{- end }}
{{- end }}

{{/*
Allow the release namespace to be overridden for multi-namespace deployments in combined charts
*/}}
{{- define "plutono.namespace" -}}
{{- if .Values.plutono.namespaceOverride }}
{{- .Values.plutono.namespaceOverride }}
{{- else }}
{{- .Release.Namespace }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "plutono.labels" -}}
helm.sh/chart: {{ include "plutono.chart" . }}
{{ include "plutono.selectorLabels" . }}
{{- if or .Chart.AppVersion .Values.plutono.image.tag }}
app.kubernetes.io/version: {{ mustRegexReplaceAllLiteral "@sha.*" .Values.plutono.image.tag "" | default .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.plutono.extraLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "plutono.selectorLabels" -}}
app.kubernetes.io/name: {{ include "plutono.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Looks if there's an existing secret and reuse its password. If not it generates
new password and use it.
*/}}
{{- define "plutono.password" -}}
{{- $secret := (lookup "v1" "Secret" (include "plutono.namespace" .) (include "plutono.fullname" .) ) }}
{{- if $secret }}
{{- index $secret "data" "admin-password" }}
{{- else }}
{{- (randAlphaNum 40) | b64enc | quote }}
{{- end }}
{{- end }}

{{/*
Return the appropriate apiVersion for rbac.
*/}}
{{- define "plutono.rbac.apiVersion" -}}
{{- if $.Capabilities.APIVersions.Has "rbac.authorization.k8s.io/v1" }}
{{- print "rbac.authorization.k8s.io/v1" }}
{{- else }}
{{- print "rbac.authorization.k8s.io/v1beta1" }}
{{- end }}
{{- end }}

{{/*
Return the appropriate apiVersion for ingress.
*/}}
{{- define "plutono.ingress.apiVersion" -}}
{{- if and ($.Capabilities.APIVersions.Has "networking.k8s.io/v1") (semverCompare ">= 1.19-0" .Capabilities.KubeVersion.Version) }}
{{- print "networking.k8s.io/v1" }}
{{- else if $.Capabilities.APIVersions.Has "networking.k8s.io/v1beta1" }}
{{- print "networking.k8s.io/v1beta1" }}
{{- else }}
{{- print "extensions/v1beta1" }}
{{- end }}
{{- end }}

{{/*
Return the appropriate apiVersion for Horizontal Pod Autoscaler.
*/}}
{{- define "plutono.hpa.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "autoscaling/v2" }}  
{{- print "autoscaling/v2" }}  
{{- else }}  
{{- print "autoscaling/v2beta2" }}  
{{- end }} 
{{- end }}

{{/*
Return the appropriate apiVersion for podDisruptionBudget.
*/}}
{{- define "plutono.podDisruptionBudget.apiVersion" -}}
{{- if $.Values.plutono.podDisruptionBudget.apiVersion }}
{{- print $.Values.plutono.podDisruptionBudget.apiVersion }}
{{- else if $.Capabilities.APIVersions.Has "policy/v1/PodDisruptionBudget" }}
{{- print "policy/v1" }}
{{- else }}
{{- print "policy/v1beta1" }}
{{- end }}
{{- end }}

{{/*
Return if ingress is stable.
*/}}
{{- define "plutono.ingress.isStable" -}}
{{- eq (include "plutono.ingress.apiVersion" .) "networking.k8s.io/v1" }}
{{- end }}

{{/*
Return if ingress supports ingressClassName.
*/}}
{{- define "plutono.ingress.supportsIngressClassName" -}}
{{- or (eq (include "plutono.ingress.isStable" .) "true") (and (eq (include "plutono.ingress.apiVersion" .) "networking.k8s.io/v1beta1") (semverCompare ">= 1.18-0" .Capabilities.KubeVersion.Version)) }}
{{- end }}

{{/*
Return if ingress supports pathType.
*/}}
{{- define "plutono.ingress.supportsPathType" -}}
{{- or (eq (include "plutono.ingress.isStable" .) "true") (and (eq (include "plutono.ingress.apiVersion" .) "networking.k8s.io/v1beta1") (semverCompare ">= 1.18-0" .Capabilities.KubeVersion.Version)) }}
{{- end }}

{{/*
Formats imagePullSecrets. Input is (dict "root" . "imagePullSecrets" .{specific imagePullSecrets})
*/}}
{{- define "plutono.imagePullSecrets" -}}
{{- $root := .root }}
{{- range (concat .root.Values.global.imagePullSecrets .imagePullSecrets) }}
{{- if eq (typeOf .) "map[string]interface {}" }}
- {{ toYaml (dict "name" (tpl .name $root)) | trim }}
{{- else }}
- name: {{ tpl . $root }}
{{- end }}
{{- end }}
{{- end }}


{{/*
 Checks whether or not the configSecret secret has to be created
 */}}
{{- define "plutono.shouldCreateConfigSecret" -}}
{{- $secretFound := false -}}
{{- range $key, $value := .Values.plutono.datasources }}
  {{- if hasKey $value "secret" }}
    {{- $secretFound = true}}
  {{- end }}
{{- end }}
{{- range $key, $value := .Values.plutono.notifiers }}
  {{- if hasKey $value "secret" }}
    {{- $secretFound = true}}
  {{- end }}
{{- end }}
{{- range $key, $value := .Values.plutono.alerting }}
  {{- if (or (hasKey $value "secret") (hasKey $value "secretFile")) }}
    {{- $secretFound = true}}
  {{- end }}
{{- end }}
{{- $secretFound}}
{{- end -}}

{{/*
    Checks whether the user is attempting to store secrets in plaintext
    in the plutono.ini configmap
*/}}
{{/* plutono.assertNoLeakedSecrets checks for sensitive keys in values */}}
{{- define "plutono.assertNoLeakedSecrets" -}}
      {{- $sensitiveKeysYaml := `
sensitiveKeys:
- path: ["database", "password"]
- path: ["smtp", "password"]
- path: ["security", "secret_key"]
- path: ["security", "admin_password"]
- path: ["auth.basic", "password"]
- path: ["auth.ldap", "bind_password"]
- path: ["auth.google", "client_secret"]
- path: ["auth.github", "client_secret"]
- path: ["auth.gitlab", "client_secret"]
- path: ["auth.generic_oauth", "client_secret"]
- path: ["auth.okta", "client_secret"]
- path: ["auth.azuread", "client_secret"]
- path: ["auth.plutono_com", "client_secret"]
- path: ["auth.plutononet", "client_secret"]
- path: ["azure", "user_identity_client_secret"]
- path: ["unified_alerting", "ha_redis_password"]
- path: ["metrics", "basic_auth_password"]
- path: ["external_image_storage.s3", "secret_key"]
- path: ["external_image_storage.webdav", "password"]
- path: ["external_image_storage.azure_blob", "account_key"]
` | fromYaml -}}
  {{- if $.Values.plutono.assertNoLeakedSecrets -}}
      {{- $plutonoIni := index .Values.plutono "plutono.ini" -}}
      {{- range $_, $secret := $sensitiveKeysYaml.sensitiveKeys -}}
        {{- $currentMap := $plutonoIni -}}
        {{- $shouldContinue := true -}}
        {{- range $index, $elem := $secret.path -}}
          {{- if and $shouldContinue (hasKey $currentMap $elem) -}}
            {{- if eq (len $secret.path) (add1 $index) -}}
              {{- if not (regexMatch "\\$(?:__(?:env|file|vault))?{[^}]+}" (index $currentMap $elem)) -}}
                {{- fail (printf "Sensitive key '%s' should not be defined explicitly in values. Use variable expansion instead. You can disable this client-side validation by changing the value of assertNoLeakedSecrets." (join "." $secret.path)) -}}
              {{- end -}}
            {{- else -}}
              {{- $currentMap = index $currentMap $elem -}}
            {{- end -}}
          {{- else -}}
              {{- $shouldContinue = false -}}
          {{- end -}}
        {{- end -}}
      {{- end -}}
  {{- end -}}
{{- end -}}
