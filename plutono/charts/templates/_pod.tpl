{{- define "plutono.pod" -}}
{{- $sts := list "sts" "StatefulSet" "statefulset" -}}
{{- $root := . -}}
{{- with .Values.plutono.schedulerName }}
schedulerName: "{{ . }}"
{{- end }}
serviceAccountName: {{ include "plutono.serviceAccountName" . }}
automountServiceAccountToken: {{ .Values.plutono.automountServiceAccountToken }}
{{- with .Values.plutono.securityContext }}
securityContext:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- with .Values.plutono.hostAliases }}
hostAliases:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- if .Values.plutono.dnsPolicy }}
dnsPolicy: {{ .Values.plutono.dnsPolicy }}
{{- end }}
{{- with .Values.plutono.dnsConfig }}
dnsConfig:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- with .Values.plutono.priorityClassName }}
priorityClassName: {{ . }}
{{- end }}
{{- if ( or .Values.plutono.persistence.enabled .Values.plutono.dashboards .Values.plutono.extraInitContainers (and .Values.plutono.sidecar.alerts.enabled .Values.plutono.sidecar.alerts.initAlerts) (and .Values.plutono.sidecar.datasources.enabled .Values.plutono.sidecar.datasources.initDatasources) (and .Values.plutono.sidecar.notifiers.enabled .Values.plutono.sidecar.notifiers.initNotifiers)) }}
initContainers:
{{- end }}
{{- if ( and .Values.plutono.persistence.enabled .Values.plutono.initChownData.enabled ) }}
  - name: init-chown-data
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.initChownData.image.registry -}}
    {{- if .Values.plutono.initChownData.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.initChownData.image.repository }}:{{ .Values.plutono.initChownData.image.tag }}@sha256:{{ .Values.plutono.initChownData.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.initChownData.image.repository }}:{{ .Values.plutono.initChownData.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.initChownData.image.pullPolicy }}
    {{- with .Values.plutono.initChownData.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    command:
      - chown
      - -R
      - {{ .Values.plutono.securityContext.runAsUser }}:{{ .Values.plutono.securityContext.runAsGroup }}
      - /var/lib/plutono
    {{- with .Values.plutono.initChownData.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: storage
        mountPath: "/var/lib/plutono"
        {{- with .Values.plutono.persistence.subPath }}
        subPath: {{ tpl . $root }}
        {{- end }}
{{- end }}
{{- if .Values.plutono.dashboards }}
  - name: download-dashboards
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.downloadDashboardsImage.registry -}}
    {{- if .Values.plutono.downloadDashboardsImage.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.downloadDashboardsImage.repository }}:{{ .Values.plutono.downloadDashboardsImage.tag }}@sha256:{{ .Values.plutono.downloadDashboardsImage.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.downloadDashboardsImage.repository }}:{{ .Values.plutono.downloadDashboardsImage.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.downloadDashboardsImage.pullPolicy }}
    command: ["/bin/sh"]
    args: [ "-c", "mkdir -p /var/lib/plutono/dashboards/default && /bin/sh -x /etc/plutono/download_dashboards.sh" ]
    {{- with .Values.plutono.downloadDashboards.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    env:
      {{- range $key, $value := .Values.plutono.downloadDashboards.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- range $key, $value := .Values.plutono.downloadDashboards.envValueFrom }}
      - name: {{ $key | quote }}
        valueFrom:
          {{- tpl (toYaml $value) $ | nindent 10 }}
      {{- end }}
    {{- with .Values.plutono.downloadDashboards.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.downloadDashboards.envFromSecret }}
    envFrom:
      - secretRef:
          name: {{ tpl . $root }}
    {{- end }}
    volumeMounts:
      - name: config
        mountPath: "/etc/plutono/download_dashboards.sh"
        subPath: download_dashboards.sh
      - name: storage
        mountPath: "/var/lib/plutono"
        {{- with .Values.plutono.persistence.subPath }}
        subPath: {{ tpl . $root }}
        {{- end }}
      {{- range .Values.plutono.extraSecretMounts }}
      - name: {{ .name }}
        mountPath: {{ .mountPath }}
        readOnly: {{ .readOnly }}
      {{- end }}
{{- end }}
{{- if and .Values.plutono.sidecar.alerts.enabled .Values.plutono.sidecar.alerts.initAlerts }}
  - name: {{ include "plutono.name" . }}-init-sc-alerts
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.alerts.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.alerts.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: "LIST"
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.alerts.label }}"
      {{- with .Values.plutono.sidecar.alerts.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote . }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.alerts.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.alerts.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/alerting"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.alerts.resource }}
      {{- with .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.alerts.searchNamespace }}
      - name: NAMESPACE
        value: {{ . | join "," | quote }}
      {{- end }}
      {{- with .Values.plutono.sidecar.alerts.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: {{ quote . }}
      {{- end }}
      {{- with .Values.plutono.sidecar.alerts.script }}
      - name: SCRIPT
        value: {{ quote . }}
      {{- end }}
    {{- with .Values.plutono.sidecar.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-alerts-volume
        mountPath: "/etc/plutono/provisioning/alerting"
      {{- with .Values.plutono.sidecar.alerts.extraMounts }}
      {{- toYaml . | trim | nindent 6 }}
      {{- end }}
{{- end }}
{{- if and .Values.plutono.sidecar.datasources.enabled .Values.plutono.sidecar.datasources.initDatasources }}
  - name: {{ include "plutono.name" . }}-init-sc-datasources
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.datasources.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- range $key, $value := .Values.plutono.sidecar.datasources.envValueFrom }}
      - name: {{ $key | quote }}
        valueFrom:
          {{- tpl (toYaml $value) $ | nindent 10 }}
      {{- end }}
      {{- if .Values.plutono.sidecar.datasources.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: "LIST"
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.datasources.label }}"
      {{- with .Values.plutono.sidecar.datasources.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote . }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.datasources.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.datasources.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/datasources"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.datasources.resource }}
      {{- with .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ . }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.datasources.searchNamespace }}
      - name: NAMESPACE
        value: "{{ tpl (.Values.plutono.sidecar.datasources.searchNamespace | join ",") . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ . }}"
      {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-datasources-volume
        mountPath: "/etc/plutono/provisioning/datasources"
{{- end }}
{{- if and .Values.plutono.sidecar.notifiers.enabled .Values.plutono.sidecar.notifiers.initNotifiers }}
  - name: {{ include "plutono.name" . }}-init-sc-notifiers
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.notifiers.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.notifiers.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: LIST
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.notifiers.label }}"
      {{- with .Values.plutono.sidecar.notifiers.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote . }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.notifiers.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.notifiers.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/notifiers"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.notifiers.resource }}
      {{- with .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.notifiers.searchNamespace }}
      - name: NAMESPACE
        value: "{{ tpl (. | join ",") $root }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ . }}"
      {{- end }}
    {{- with .Values.plutono.sidecar.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-notifiers-volume
        mountPath: "/etc/plutono/provisioning/notifiers"
{{- end}}
{{- with .Values.plutono.extraInitContainers }}
  {{- tpl (toYaml .) $root | nindent 2 }}
{{- end }}
{{- if or .Values.plutono.image.pullSecrets .Values.global.imagePullSecrets }}
imagePullSecrets:
  {{- include "plutono.imagePullSecrets" (dict "root" $root "imagePullSecrets" .Values.plutono.image.pullSecrets) | nindent 2 }}
{{- end }}
{{- if not .Values.plutono.enableKubeBackwardCompatibility }}
enableServiceLinks: {{ .Values.plutono.enableServiceLinks }}
{{- end }}
containers:
{{- if and .Values.plutono.sidecar.alerts.enabled (not .Values.plutono.sidecar.alerts.initAlerts) }}
  - name: {{ include "plutono.name" . }}-sc-alerts
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.alerts.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.alerts.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: {{ .Values.plutono.sidecar.alerts.watchMethod }}
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.alerts.label }}"
      {{- with .Values.plutono.sidecar.alerts.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote . }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.alerts.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.alerts.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/alerting"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.alerts.resource }}
      {{- with .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.alerts.searchNamespace }}
      - name: NAMESPACE
        value: {{ . | join "," | quote }}
      {{- end }}
      {{- with .Values.plutono.sidecar.alerts.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: {{ quote . }}
      {{- end }}
      {{- with .Values.plutono.sidecar.alerts.script }}
      - name: SCRIPT
        value: {{ quote . }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_USER) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_USERNAME
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.userKey | default "admin-user" }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.passwordKey | default "admin-password" }}
      {{- end }}
      {{- if not .Values.plutono.sidecar.alerts.skipReload }}
      - name: REQ_URL
        value: {{ .Values.plutono.sidecar.alerts.reloadURL }}
      - name: REQ_METHOD
        value: POST
      {{- end }}
      {{- if .Values.plutono.sidecar.alerts.watchServerTimeout }}
      {{- if ne .Values.plutono.sidecar.alerts.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.alerts.watchServerTimeout with .Values.plutono.sidecar.alerts.watchMethod %s" .Values.plutono.sidecar.alerts.watchMethod) }}
      {{- end }}
      - name: WATCH_SERVER_TIMEOUT
        value: "{{ .Values.plutono.sidecar.alerts.watchServerTimeout }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.alerts.watchClientTimeout }}
      {{- if ne .Values.plutono.sidecar.alerts.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.alerts.watchClientTimeout with .Values.plutono.sidecar.alerts.watchMethod %s" .Values.plutono.sidecar.alerts.watchMethod) }}
      {{- end }}
      - name: WATCH_CLIENT_TIMEOUT
        value: "{{ .Values.plutono.sidecar.alerts.watchClientTimeout }}"
      {{- end }}
    {{- with .Values.plutono.sidecar.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-alerts-volume
        mountPath: "/etc/plutono/provisioning/alerting"
      {{- with .Values.plutono.sidecar.alerts.extraMounts }}
      {{- toYaml . | trim | nindent 6 }}
      {{- end }}
{{- end}}
{{- if .Values.plutono.sidecar.dashboards.enabled }}
  - name: {{ include "plutono.name" . }}-sc-dashboard
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.dashboards.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- range $key, $value := .Values.plutono.sidecar.dashboards.envValueFrom }}
      - name: {{ $key | quote }}
        valueFrom:
          {{- tpl (toYaml $value) $ | nindent 10 }}
      {{- end }}
      {{- if .Values.plutono.sidecar.dashboards.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: {{ .Values.plutono.sidecar.dashboards.watchMethod }}
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.dashboards.label }}"
      {{- with .Values.plutono.sidecar.dashboards.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote . }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.dashboards.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.dashboards.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "{{ .Values.plutono.sidecar.dashboards.folder }}{{- with .Values.plutono.sidecar.dashboards.defaultFolderName }}/{{ . }}{{- end }}"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.dashboards.resource }}
      {{- with .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.dashboards.searchNamespace }}
      - name: NAMESPACE
        value: "{{ tpl (. | join ",") $root }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.dashboards.folderAnnotation }}
      - name: FOLDER_ANNOTATION
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.dashboards.script }}
      - name: SCRIPT
        value: "{{ . }}"
      {{- end }}
      {{- if not .Values.plutono.sidecar.dashboards.skipReload }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_USER) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_USERNAME
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.userKey | default "admin-user" }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.passwordKey | default "admin-password" }}
      {{- end }}
      - name: REQ_URL
        value: {{ .Values.plutono.sidecar.dashboards.reloadURL }}
      - name: REQ_METHOD
        value: POST
      {{- end }}
      {{- if .Values.plutono.sidecar.dashboards.watchServerTimeout }}
      {{- if ne .Values.plutono.sidecar.dashboards.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.dashboards.watchServerTimeout with .Values.plutono.sidecar.dashboards.watchMethod %s" .Values.plutono.sidecar.dashboards.watchMethod) }}
      {{- end }}
      - name: WATCH_SERVER_TIMEOUT
        value: "{{ .Values.plutono.sidecar.dashboards.watchServerTimeout }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.dashboards.watchClientTimeout }}
      {{- if ne .Values.plutono.sidecar.dashboards.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.dashboards.watchClientTimeout with .Values.plutono.sidecar.dashboards.watchMethod %s" .Values.plutono.sidecar.dashboards.watchMethod) }}
      {{- end }}
      - name: WATCH_CLIENT_TIMEOUT
        value: {{ .Values.plutono.sidecar.dashboards.watchClientTimeout | quote }}
      {{- end }}
    {{- with .Values.plutono.sidecar.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-dashboard-volume
        mountPath: {{ .Values.plutono.sidecar.dashboards.folder | quote }}
      {{- with .Values.plutono.sidecar.dashboards.extraMounts }}
      {{- toYaml . | trim | nindent 6 }}
      {{- end }}
{{- end}}
{{- if and .Values.plutono.sidecar.datasources.enabled (not .Values.plutono.sidecar.datasources.initDatasources) }}
  - name: {{ include "plutono.name" . }}-sc-datasources
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.datasources.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- range $key, $value := .Values.plutono.sidecar.datasources.envValueFrom }}
      - name: {{ $key | quote }}
        valueFrom:
          {{- tpl (toYaml $value) $ | nindent 10 }}
      {{- end }}
      {{- if .Values.plutono.sidecar.datasources.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: {{ .Values.plutono.sidecar.datasources.watchMethod }}
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.datasources.label }}"
      {{- with .Values.plutono.sidecar.datasources.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote . }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.datasources.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.datasources.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/datasources"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.datasources.resource }}
      {{- with .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.datasources.searchNamespace }}
      - name: NAMESPACE
        value: "{{ tpl (. | join ",") $root }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ .Values.plutono.sidecar.skipTlsVerify }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.datasources.script }}
      - name: SCRIPT
        value: "{{ .Values.plutono.sidecar.datasources.script }}"
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_USER) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_USERNAME
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.userKey | default "admin-user" }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.passwordKey | default "admin-password" }}
      {{- end }}
      {{- if not .Values.plutono.sidecar.datasources.skipReload }}
      - name: REQ_URL
        value: {{ .Values.plutono.sidecar.datasources.reloadURL }}
      - name: REQ_METHOD
        value: POST
      {{- end }}
      {{- if .Values.plutono.sidecar.datasources.watchServerTimeout }}
      {{- if ne .Values.plutono.sidecar.datasources.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.datasources.watchServerTimeout with .Values.plutono.sidecar.datasources.watchMethod %s" .Values.plutono.sidecar.datasources.watchMethod) }}
      {{- end }}
      - name: WATCH_SERVER_TIMEOUT
        value: "{{ .Values.plutono.sidecar.datasources.watchServerTimeout }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.datasources.watchClientTimeout }}
      {{- if ne .Values.plutono.sidecar.datasources.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.datasources.watchClientTimeout with .Values.plutono.sidecar.datasources.watchMethod %s" .Values.plutono.sidecar.datasources.watchMethod) }}
      {{- end }}
      - name: WATCH_CLIENT_TIMEOUT
        value: "{{ .Values.plutono.sidecar.datasources.watchClientTimeout }}"
      {{- end }}
    {{- with .Values.plutono.sidecar.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-datasources-volume
        mountPath: "/etc/plutono/provisioning/datasources"
{{- end}}
{{- if .Values.plutono.sidecar.notifiers.enabled }}
  - name: {{ include "plutono.name" . }}-sc-notifiers
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.notifiers.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.notifiers.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: {{ .Values.plutono.sidecar.notifiers.watchMethod }}
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.notifiers.label }}"
      {{- with .Values.plutono.sidecar.notifiers.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote . }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.notifiers.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.notifiers.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/notifiers"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.notifiers.resource }}
      {{- if .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ .Values.plutono.sidecar.enableUniqueFilenames }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.notifiers.searchNamespace }}
      - name: NAMESPACE
        value: "{{ tpl (. | join ",") $root }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ . }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.notifiers.script }}
      - name: SCRIPT
        value: "{{ .Values.plutono.sidecar.notifiers.script }}"
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_USER) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_USERNAME
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.userKey | default "admin-user" }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.passwordKey | default "admin-password" }}
      {{- end }}
      {{- if not .Values.plutono.sidecar.notifiers.skipReload }}
      - name: REQ_URL
        value: {{ .Values.plutono.sidecar.notifiers.reloadURL }}
      - name: REQ_METHOD
        value: POST
      {{- end }}
      {{- if .Values.plutono.sidecar.notifiers.watchServerTimeout }}
      {{- if ne .Values.plutono.sidecar.notifiers.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.notifiers.watchServerTimeout with .Values.plutono.sidecar.notifiers.watchMethod %s" .Values.plutono.sidecar.notifiers.watchMethod) }}
      {{- end }}
      - name: WATCH_SERVER_TIMEOUT
        value: "{{ .Values.plutono.sidecar.notifiers.watchServerTimeout }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.notifiers.watchClientTimeout }}
      {{- if ne .Values.plutono.sidecar.notifiers.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.notifiers.watchClientTimeout with .Values.plutono.sidecar.notifiers.watchMethod %s" .Values.plutono.sidecar.notifiers.watchMethod) }}
      {{- end }}
      - name: WATCH_CLIENT_TIMEOUT
        value: "{{ .Values.plutono.sidecar.notifiers.watchClientTimeout }}"
      {{- end }}
    {{- with .Values.plutono.sidecar.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-notifiers-volume
        mountPath: "/etc/plutono/provisioning/notifiers"
{{- end}}
{{- if .Values.plutono.sidecar.plugins.enabled }}
  - name: {{ include "plutono.name" . }}-sc-plugins
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.sidecar.image.registry -}}
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      {{- range $key, $value := .Values.plutono.sidecar.plugins.env }}
      - name: "{{ $key }}"
        value: "{{ $value }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.plugins.ignoreAlreadyProcessed }}
      - name: IGNORE_ALREADY_PROCESSED
        value: "true"
      {{- end }}
      - name: METHOD
        value: {{ .Values.plutono.sidecar.plugins.watchMethod }}
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.plugins.label }}"
      {{- if .Values.plutono.sidecar.plugins.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote .Values.plutono.sidecar.plugins.labelValue }}
      {{- end }}
      {{- if or .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.plugins.logLevel }}
      - name: LOG_LEVEL
        value: {{ default .Values.plutono.sidecar.logLevel .Values.plutono.sidecar.plugins.logLevel }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/plugins"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.plugins.resource }}
      {{- with .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.plugins.searchNamespace }}
      - name: NAMESPACE
        value: "{{ tpl (. | join ",") $root }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.plugins.script }}
      - name: SCRIPT
        value: "{{ . }}"
      {{- end }}
      {{- with .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ . }}"
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_USER) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_USERNAME
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.userKey | default "admin-user" }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: REQ_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.passwordKey | default "admin-password" }}
      {{- end }}
      {{- if not .Values.plutono.sidecar.plugins.skipReload }}
      - name: REQ_URL
        value: {{ .Values.plutono.sidecar.plugins.reloadURL }}
      - name: REQ_METHOD
        value: POST
      {{- end }}
      {{- if .Values.plutono.sidecar.plugins.watchServerTimeout }}
      {{- if ne .Values.plutono.sidecar.plugins.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.plugins.watchServerTimeout with .Values.plutono.sidecar.plugins.watchMethod %s" .Values.plutono.sidecar.plugins.watchMethod) }}
      {{- end }}
      - name: WATCH_SERVER_TIMEOUT
        value: "{{ .Values.plutono.sidecar.plugins.watchServerTimeout }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.plugins.watchClientTimeout }}
      {{- if ne .Values.plutono.sidecar.plugins.watchMethod "WATCH" }}
        {{- fail (printf "Cannot use .Values.plutono.sidecar.plugins.watchClientTimeout with .Values.plutono.sidecar.plugins.watchMethod %s" .Values.plutono.sidecar.plugins.watchMethod) }}
      {{- end }}
      - name: WATCH_CLIENT_TIMEOUT
        value: "{{ .Values.plutono.sidecar.plugins.watchClientTimeout }}"
      {{- end }}
    {{- with .Values.plutono.sidecar.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.sidecar.securityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: sc-plugins-volume
        mountPath: "/etc/plutono/provisioning/plugins"
{{- end}}
  - name: {{ .Chart.Name }}
    {{- $registry := .Values.global.imageRegistry | default .Values.plutono.image.registry -}}
    {{- if .Values.plutono.image.sha }}
    image: "{{ $registry }}/{{ .Values.plutono.image.repository }}:{{ .Values.plutono.image.tag | default .Chart.AppVersion }}@sha256:{{ .Values.plutono.image.sha }}"
    {{- else }}
    image: "{{ $registry }}/{{ .Values.plutono.image.repository }}:{{ .Values.plutono.image.tag | default .Chart.AppVersion }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.image.pullPolicy }}
    {{- if .Values.plutono.command }}
    command:
    {{- range .Values.plutono.command }}
      - {{ . | quote }}
    {{- end }}
    {{- end }}
    {{- if .Values.plutono.args }}
    args:
    {{- range .Values.plutono.args }}
      - {{ . | quote }}
    {{- end }}
    {{- end }}
    {{- with .Values.plutono.containerSecurityContext }}
    securityContext:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    volumeMounts:
      - name: config
        mountPath: "/etc/plutono/plutono.ini"
        subPath: plutono.ini
      {{- if .Values.plutono.ldap.enabled }}
      - name: ldap
        mountPath: "/etc/plutono/ldap.toml"
        subPath: ldap.toml
      {{- end }}
      {{- range .Values.plutono.extraConfigmapMounts }}
      - name: {{ tpl .name $root }}
        mountPath: {{ tpl .mountPath $root }}
        subPath: {{ tpl (.subPath | default "") $root }}
        readOnly: {{ .readOnly }}
      {{- end }}
      - name: storage
        mountPath: "/var/lib/plutono"
        {{- with .Values.plutono.persistence.subPath }}
        subPath: {{ tpl . $root }}
        {{- end }}
      {{- with .Values.plutono.dashboards }}
      {{- range $provider, $dashboards := . }}
      {{- range $key, $value := $dashboards }}
      {{- if (or (hasKey $value "json") (hasKey $value "file")) }}
      - name: dashboards-{{ $provider }}
        mountPath: "/var/lib/plutono/dashboards/{{ $provider }}/{{ $key }}.json"
        subPath: "{{ $key }}.json"
      {{- end }}
      {{- end }}
      {{- end }}
      {{- end }}
      {{- with .Values.plutono.dashboardsConfigMaps }}
      {{- range (keys . | sortAlpha) }}
      - name: dashboards-{{ . }}
        mountPath: "/var/lib/plutono/dashboards/{{ . }}"
      {{- end }}
      {{- end }}
      {{- with .Values.plutono.datasources }}
      {{- $datasources := . }}
      {{- range (keys . | sortAlpha) }}
      {{- if (or (hasKey (index $datasources .) "secret")) }} {{/*check if current datasource should be handeled as secret */}}
      - name: config-secret
        mountPath: "/etc/plutono/provisioning/datasources/{{ . }}"
        subPath: {{ . | quote }}
      {{- else }}
      - name: config
        mountPath: "/etc/plutono/provisioning/datasources/{{ . }}"
        subPath: {{ . | quote }}
      {{- end }}
      {{- end }}
      {{- end }}
      {{- with .Values.plutono.notifiers }}
      {{- $notifiers := . }}
      {{- range (keys . | sortAlpha) }}
      {{- if (or (hasKey (index $notifiers .) "secret")) }} {{/*check if current notifier should be handeled as secret */}}
      - name: config-secret
        mountPath: "/etc/plutono/provisioning/notifiers/{{ . }}"
        subPath: {{ . | quote }}
      {{- else }}
      - name: config
        mountPath: "/etc/plutono/provisioning/notifiers/{{ . }}"
        subPath: {{ . | quote }}
      {{- end }}
      {{- end }}
      {{- end }}
      {{- with .Values.plutono.alerting }}
      {{- $alertingmap := .}}
      {{- range (keys . | sortAlpha) }}
      {{- if (or (hasKey (index $.Values.plutono.alerting .) "secret") (hasKey (index $.Values.plutono.alerting .) "secretFile")) }} {{/*check if current alerting entry should be handeled as secret */}}
      - name: config-secret
        mountPath: "/etc/plutono/provisioning/alerting/{{ . }}"
        subPath: {{ . | quote }}
      {{- else }}
      - name: config
        mountPath: "/etc/plutono/provisioning/alerting/{{ . }}"
        subPath: {{ . | quote }}
      {{- end }}
      {{- end }}
      {{- end }}
      {{- with .Values.plutono.dashboardProviders }}
      {{- range (keys . | sortAlpha) }}
      - name: config
        mountPath: "/etc/plutono/provisioning/dashboards/{{ . }}"
        subPath: {{ . | quote }}
      {{- end }}
      {{- end }}
      {{- with .Values.plutono.sidecar.alerts.enabled }}
      - name: sc-alerts-volume
        mountPath: "/etc/plutono/provisioning/alerting"
      {{- end}}
      {{- if .Values.plutono.sidecar.dashboards.enabled }}
      - name: sc-dashboard-volume
        mountPath: {{ .Values.plutono.sidecar.dashboards.folder | quote }}
      {{- if .Values.plutono.sidecar.dashboards.SCProvider }}
      - name: sc-dashboard-provider
        mountPath: "/etc/plutono/provisioning/dashboards/sc-dashboardproviders.yaml"
        subPath: provider.yaml
      {{- end}}
      {{- end}}
      {{- if .Values.plutono.sidecar.datasources.enabled }}
      - name: sc-datasources-volume
        mountPath: "/etc/plutono/provisioning/datasources"
      {{- end}}
      {{- if .Values.plutono.sidecar.plugins.enabled }}
      - name: sc-plugins-volume
        mountPath: "/etc/plutono/provisioning/plugins"
      {{- end}}
      {{- if .Values.plutono.sidecar.notifiers.enabled }}
      - name: sc-notifiers-volume
        mountPath: "/etc/plutono/provisioning/notifiers"
      {{- end}}
      {{- range .Values.plutono.extraSecretMounts }}
      - name: {{ .name }}
        mountPath: {{ .mountPath }}
        readOnly: {{ .readOnly }}
        subPath: {{ .subPath | default "" }}
      {{- end }}
      {{- range .Values.plutono.extraVolumeMounts }}
      - name: {{ .name }}
        mountPath: {{ .mountPath }}
        subPath: {{ .subPath | default "" }}
        readOnly: {{ .readOnly }}
      {{- end }}
      {{- range .Values.plutono.extraEmptyDirMounts }}
      - name: {{ .name }}
        mountPath: {{ .mountPath }}
      {{- end }}
    ports:
      - name: {{ .Values.plutono.podPortName }}
        containerPort: {{ .Values.plutono.service.targetPort }}
        protocol: TCP
      - name: {{ .Values.plutono.gossipPortName }}-tcp
        containerPort: 9094
        protocol: TCP
      - name: {{ .Values.plutono.gossipPortName }}-udp
        containerPort: 9094
        protocol: UDP
    env:
      - name: POD_IP
        valueFrom:
          fieldRef:
            fieldPath: status.podIP
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_USER) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: PL_SECURITY_ADMIN_USER
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.userKey | default "admin-user" }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) (not .Values.plutono.env.PL_SECURITY_DISABLE_INITIAL_ADMIN_CREATION) }}
      - name: PL_SECURITY_ADMIN_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ (tpl .Values.plutono.admin.existingSecret .) | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.passwordKey | default "admin-password" }}
      {{- end }}
      {{- if .Values.plutono.plugins }}
      - name: PL_INSTALL_PLUGINS
        valueFrom:
          configMapKeyRef:
            name: {{ include "plutono.fullname" . }}
            key: plugins
      {{- end }}
      {{- if .Values.plutono.smtp.existingSecret }}
      - name: PL_SMTP_USER
        valueFrom:
          secretKeyRef:
            name: {{ .Values.plutono.smtp.existingSecret }}
            key: {{ .Values.plutono.smtp.userKey | default "user" }}
      - name: PL_SMTP_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ .Values.plutono.smtp.existingSecret }}
            key: {{ .Values.plutono.smtp.passwordKey | default "password" }}
      {{- end }}
      - name: PL_PATHS_DATA
        value: {{ (get .Values.plutono "plutono.ini").paths.data }}
      - name: PL_PATHS_LOGS
        value: {{ (get .Values.plutono "plutono.ini").paths.logs }}
      - name: PL_PATHS_PLUGINS
        value: {{ (get .Values.plutono "plutono.ini").paths.plugins }}
      - name: PL_PATHS_PROVISIONING
        value: {{ (get .Values.plutono "plutono.ini").paths.provisioning }}
      {{- range $key, $value := .Values.plutono.envValueFrom }}
      - name: {{ $key | quote }}
        valueFrom:
          {{- tpl (toYaml $value) $ | nindent 10 }}
      {{- end }}
      {{- range $key, $value := .Values.plutono.env }}
      - name: "{{ tpl $key $ }}"
        value: "{{ tpl (print $value) $ }}"
      {{- end }}
      {{- if not .Values.plutono.ingress.enabled }}
      - name: PL_SERVER_ROOT_URL
        value: {{ printf "/api/v1/namespaces/%s/services/%s:80/proxy/" .Release.Namespace .Release.Name }}
      - name: PL_SERVER_SERVE_FROM_SUB_PATH
        value: "true"
      {{- end }}
    {{- if or .Values.plutono.envFromSecret (or .Values.plutono.envRenderSecret .Values.plutono.envFromSecrets) .Values.plutono.envFromConfigMaps }}
    envFrom:
      {{- if .Values.plutono.envFromSecret }}
      - secretRef:
          name: {{ tpl .Values.plutono.envFromSecret . }}
      {{- end }}
      {{- if .Values.plutono.envRenderSecret }}
      - secretRef:
          name: {{ include "plutono.fullname" . }}-env
      {{- end }}
      {{- range .Values.plutono.envFromSecrets }}
      - secretRef:
          name: {{ tpl .name $ }}
          optional: {{ .optional | default false }}
        {{- if .prefix }}
        prefix: {{ tpl .prefix $ }}
        {{- end }}
      {{- end }}
      {{- range .Values.plutono.envFromConfigMaps }}
      - configMapRef:
          name: {{ tpl .name $ }}
          optional: {{ .optional | default false }}
        {{- if .prefix }}
        prefix: {{ tpl .prefix $ }}
        {{- end }}
      {{- end }}
    {{- end }}
    {{- with .Values.plutono.livenessProbe }}
    livenessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.readinessProbe }}
    readinessProbe:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.lifecycleHooks }}
    lifecycle:
      {{- tpl (toYaml .) $root | nindent 6 }}
    {{- end }}
    {{- with .Values.plutono.resources }}
    resources:
      {{- toYaml . | nindent 6 }}
    {{- end }}
{{- with .Values.plutono.extraContainers }}
  {{- tpl . $ | nindent 2 }}
{{- end }}
{{- with .Values.plutono.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- with .Values.plutono.affinity }}
affinity:
  {{- tpl (toYaml .) $root | nindent 2 }}
{{- end }}
{{- with .Values.plutono.topologySpreadConstraints }}
topologySpreadConstraints:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- with .Values.plutono.tolerations }}
tolerations:
  {{- toYaml . | nindent 2 }}
{{- end }}
volumes:
  - name: config
    configMap:
      name: {{ include "plutono.fullname" . }}
  {{- $createConfigSecret := eq (include "plutono.shouldCreateConfigSecret" .) "true" -}}
  {{- if and .Values.plutono.createConfigmap $createConfigSecret }}
  - name: config-secret
    secret:
      secretName: {{ include "plutono.fullname" . }}-config-secret
  {{- end }}
  {{- range .Values.plutono.extraConfigmapMounts }}
  - name: {{ tpl .name $root }}
    configMap:
      name: {{ tpl .configMap $root }}
      {{- with .optional }}
      optional: {{ . }}
      {{- end }}
      {{- with .items }}
      items:
        {{- toYaml . | nindent 8 }}
      {{- end }}
  {{- end }}
  {{- if .Values.plutono.dashboards }}
  {{- range (keys .Values.plutono.dashboards | sortAlpha) }}
  - name: dashboards-{{ . }}
    configMap:
      name: {{ include "plutono.fullname" $ }}-dashboards-{{ . }}
  {{- end }}
  {{- end }}
  {{- if .Values.plutono.dashboardsConfigMaps }}
  {{- range $provider, $name := .Values.plutono.dashboardsConfigMaps }}
  - name: dashboards-{{ $provider }}
    configMap:
      name: {{ tpl $name $root }}
  {{- end }}
  {{- end }}
  {{- if .Values.plutono.ldap.enabled }}
  - name: ldap
    secret:
      {{- if .Values.plutono.ldap.existingSecret }}
      secretName: {{ .Values.plutono.ldap.existingSecret }}
      {{- else }}
      secretName: {{ include "plutono.fullname" . }}
      {{- end }}
      items:
        - key: ldap-toml
          path: ldap.toml
  {{- end }}
  {{- if and .Values.plutono.persistence.enabled (eq .Values.plutono.persistence.type "pvc") }}
  - name: storage
    persistentVolumeClaim:
      claimName: {{ tpl (.Values.plutono.persistence.existingClaim | default (include "plutono.fullname" .)) . }}
  {{- else if and .Values.plutono.persistence.enabled (has .Values.plutono.persistence.type $sts) }}
  {{/* nothing */}}
  {{- else }}
  - name: storage
    {{- if .Values.plutono.persistence.inMemory.enabled }}
    emptyDir:
      medium: Memory
      {{- with .Values.plutono.persistence.inMemory.sizeLimit }}
      sizeLimit: {{ . }}
      {{- end }}
    {{- else }}
    emptyDir: {}
    {{- end }}
  {{- end }}
  {{- if .Values.plutono.sidecar.alerts.enabled }}
  - name: sc-alerts-volume
    emptyDir:
      {{- with .Values.plutono.sidecar.alerts.sizeLimit }}
      sizeLimit: {{ . }}
      {{- else }}
      {}
      {{- end }}
  {{- end }}
  {{- if .Values.plutono.sidecar.dashboards.enabled }}
  - name: sc-dashboard-volume
    emptyDir:
      {{- with .Values.plutono.sidecar.dashboards.sizeLimit }}
      sizeLimit: {{ . }}
      {{- else }}
      {}
      {{- end }}
  {{- if .Values.plutono.sidecar.dashboards.SCProvider }}
  - name: sc-dashboard-provider
    configMap:
      name: {{ include "plutono.fullname" . }}-config-dashboards
  {{- end }}
  {{- end }}
  {{- if .Values.plutono.sidecar.datasources.enabled }}
  - name: sc-datasources-volume
    emptyDir:
      {{- with .Values.plutono.sidecar.datasources.sizeLimit }}
      sizeLimit: {{ . }}
      {{- else }}
      {}
      {{- end }}
  {{- end }}
  {{- if .Values.plutono.sidecar.plugins.enabled }}
  - name: sc-plugins-volume
    emptyDir:
      {{- with .Values.plutono.sidecar.plugins.sizeLimit }}
      sizeLimit: {{ . }}
      {{- else }}
      {}
      {{- end }}
  {{- end }}
  {{- if .Values.plutono.sidecar.notifiers.enabled }}
  - name: sc-notifiers-volume
    emptyDir:
      {{- with .Values.plutono.sidecar.notifiers.sizeLimit }}
      sizeLimit: {{ . }}
      {{- else }}
      {}
      {{- end }}
  {{- end }}
  {{- range .Values.plutono.extraSecretMounts }}
  {{- if .secretName }}
  - name: {{ .name }}
    secret:
      secretName: {{ .secretName }}
      defaultMode: {{ .defaultMode }}
      {{- with .optional }}
      optional: {{ . }}
      {{- end }}
      {{- with .items }}
      items:
        {{- toYaml . | nindent 8 }}
      {{- end }}
  {{- else if .projected }}
  - name: {{ .name }}
    projected:
      {{- toYaml .projected | nindent 6 }}
  {{- else if .csi }}
  - name: {{ .name }}
    csi:
      {{- toYaml .csi | nindent 6 }}
  {{- end }}
  {{- end }}
  {{- range .Values.plutono.extraVolumes }}
  - name: {{ .name }}
    {{- if .existingClaim }}
    persistentVolumeClaim:
      claimName: {{ .existingClaim }}
    {{- else if .hostPath }}
    hostPath:
      {{ toYaml .hostPath | nindent 6 }}
    {{- else if .csi }}
    csi:
      {{- toYaml .csi | nindent 6 }}
    {{- else if .configMap }}
    configMap:
      {{- toYaml .configMap | nindent 6 }}
    {{- else if .emptyDir }}
    emptyDir:
      {{- toYaml .emptyDir | nindent 6 }}
    {{- else }}
    emptyDir: {}
    {{- end }}
  {{- end }}
  {{- range .Values.plutono.extraEmptyDirMounts }}
  - name: {{ .name }}
    emptyDir: {}
  {{- end }}
  {{- with .Values.plutono.extraContainerVolumes }}
  {{- tpl (toYaml .) $root | nindent 2 }}
  {{- end }}
{{- end }}
