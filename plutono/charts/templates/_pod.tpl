{{- define "plutono.pod" -}}
{{- if .Values.plutono.schedulerName }}
schedulerName: "{{ .Values.plutono.schedulerName }}"
{{- end }}
serviceAccountName: {{ template "plutono.serviceAccountName" . }}
{{- if .Values.plutono.securityContext }}
securityContext:
{{ toYaml .Values.plutono.securityContext | indent 2 }}
{{- end }}
{{- if .Values.plutono.hostAliases }}
hostAliases:
{{ toYaml .Values.plutono.hostAliases | indent 2 }}
{{- end }}
{{- if .Values.plutono.priorityClassName }}
priorityClassName: {{ .Values.plutono.priorityClassName }}
{{- end }}
{{- if ( or .Values.plutono.persistence.enabled .Values.plutono.dashboards .Values.plutono.sidecar.datasources.enabled .Values.plutono.sidecar.notifiers.enabled .Values.plutono.extraInitContainers) }}
initContainers:
{{- end }}
{{- if .Values.plutono.sidecar.datasources.enabled }}
  - name: {{ template "plutono.name" . }}-sc-datasources
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      - name: METHOD
        value: LIST
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.datasources.label }}"
      {{- if .Values.plutono.sidecar.datasources.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote .Values.plutono.sidecar.datasources.labelValue }}
      {{- end }}
      - name: FOLDER
        value: "/etc/plutono/provisioning/datasources"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.datasources.resource }}
      {{- if .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ .Values.plutono.sidecar.enableUniqueFilenames }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.datasources.searchNamespace }}
      - name: NAMESPACE
        value: "{{ .Values.plutono.sidecar.datasources.searchNamespace }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ .Values.plutono.sidecar.skipTlsVerify }}"
      {{- end }}
    resources:
{{ toYaml .Values.plutono.sidecar.resources | indent 6 }}
    volumeMounts:
      - name: sc-datasources-volume
        mountPath: "/etc/plutono/provisioning/datasources"
{{- end}}
{{- if .Values.plutono.extraInitContainers }}
{{ toYaml .Values.plutono.extraInitContainers | indent 2 }}
{{- end }}
{{- if .Values.plutono.image.pullSecrets }}
imagePullSecrets:
{{- range .Values.plutono.image.pullSecrets }}
  - name: {{ . }}
{{- end}}
{{- end }}
containers:
{{- if .Values.plutono.sidecar.dashboards.enabled }}
  - name: {{ template "plutono.name" . }}-sc-dashboard
    {{- if .Values.plutono.sidecar.image.sha }}
    image: "{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}@sha256:{{ .Values.plutono.sidecar.image.sha }}"
    {{- else }}
    image: "{{ .Values.plutono.sidecar.image.repository }}:{{ .Values.plutono.sidecar.image.tag }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.sidecar.imagePullPolicy }}
    env:
      - name: METHOD
        value: {{ .Values.plutono.sidecar.dashboards.watchMethod }}
      - name: LABEL
        value: "{{ .Values.plutono.sidecar.dashboards.label }}"
      {{- if .Values.plutono.sidecar.dashboards.labelValue }}
      - name: LABEL_VALUE
        value: {{ quote .Values.plutono.sidecar.dashboards.labelValue }}
      {{- end }}
      - name: FOLDER
        value: "{{ .Values.plutono.sidecar.dashboards.folder }}{{- with .Values.plutono.sidecar.dashboards.defaultFolderName }}/{{ . }}{{- end }}"
      - name: RESOURCE
        value: {{ quote .Values.plutono.sidecar.dashboards.resource }}
      {{- if .Values.plutono.sidecar.enableUniqueFilenames }}
      - name: UNIQUE_FILENAMES
        value: "{{ .Values.plutono.sidecar.enableUniqueFilenames }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.dashboards.searchNamespace }}
      - name: NAMESPACE
        value: "{{ .Values.plutono.sidecar.dashboards.searchNamespace }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.skipTlsVerify }}
      - name: SKIP_TLS_VERIFY
        value: "{{ .Values.plutono.sidecar.skipTlsVerify }}"
      {{- end }}
      {{- if .Values.plutono.sidecar.dashboards.folderAnnotation }}
      - name: FOLDER_ANNOTATION
        value: "{{ .Values.plutono.sidecar.dashboards.folderAnnotation }}"
      {{- end }}
    resources:
{{ toYaml .Values.plutono.sidecar.resources | indent 6 }}
    volumeMounts:
      - name: sc-dashboard-volume
        mountPath: {{ .Values.plutono.sidecar.dashboards.folder | quote }}
{{- end}}
  - name: {{ .Chart.Name }}
    {{- if .Values.plutono.image.sha }}
    image: "{{ .Values.plutono.image.repository }}:{{ .Values.plutono.image.tag | default .Chart.AppVersion }}@sha256:{{ .Values.plutono.image.sha }}"
    {{- else }}
    image: "{{ .Values.plutono.image.repository }}:{{ .Values.plutono.image.tag | default .Chart.AppVersion }}"
    {{- end }}
    imagePullPolicy: {{ .Values.plutono.image.pullPolicy }}
  {{- if .Values.plutono.command }}
    command:
    {{- range .Values.plutono.command }}
      - {{ . }}
    {{- end }}
  {{- end}}
{{- if .Values.plutono.containerSecurityContext }}
    securityContext:
{{- toYaml .Values.plutono.containerSecurityContext | nindent 6 }}
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
      - name: {{ .name }}
        mountPath: {{ .mountPath }}
        subPath: {{ .subPath | default "" }}
        readOnly: {{ .readOnly }}
      {{- end }}
      - name: storage
        mountPath: "/var/lib/plutono"
{{- if .Values.plutono.persistence.subPath }}
        subPath: {{ .Values.plutono.persistence.subPath }}
{{- end }}
{{- if .Values.plutono.sidecar.dashboards.enabled }}
      - name: sc-dashboard-volume
        mountPath: {{ .Values.plutono.sidecar.dashboards.folder | quote }}
{{- end}}
{{- if .Values.plutono.sidecar.datasources.enabled }}
      - name: sc-datasources-volume
        mountPath: "/etc/plutono/provisioning/datasources"
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
      - name: {{ .Values.plutono.service.portName }}
        containerPort: {{ .Values.plutono.service.port }}
        protocol: TCP
      - name: {{ .Values.plutono.podPortName }}
        containerPort: 3000
        protocol: TCP
    env:
      {{- if not .Values.plutono.env.PL_SECURITY_ADMIN_USER }}
      - name: PL_SECURITY_ADMIN_USER
        valueFrom:
          secretKeyRef:
            name: {{ .Values.plutono.admin.existingSecret | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.userKey | default "admin-user" }}
      {{- end }}
      {{- if and (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD) (not .Values.plutono.env.PL_SECURITY_ADMIN_PASSWORD__FILE) }}
      - name: PL_SECURITY_ADMIN_PASSWORD
        valueFrom:
          secretKeyRef:
            name: {{ .Values.plutono.admin.existingSecret | default (include "plutono.fullname" .) }}
            key: {{ .Values.plutono.admin.passwordKey | default "admin-password" }}
      {{- end }}
      {{- if .Values.plutono.oidc.enabled }}
      - name: PL_AUTH_GENERIC_OAUTH_CLIENT_ID
        value: {{ .Values.plutono.oidc.clientID }}
      - name: PL_AUTH_GENERIC_OAUTH_SECRET
        value: {{ .Values.plutono.oidc.clientSecret }}
      {{- end }}
    {{- range $key, $value := .Values.plutono.envValueFrom }}
      - name: {{ $key | quote }}
        valueFrom:
{{ toYaml $value | indent 10 }}
    {{- end }}
{{- range $key, $value := .Values.plutono.env }}
      - name: "{{ tpl $key $ }}"
        value: "{{ tpl (print $value) $ }}"
{{- end }}
    {{- if .Values.plutono.envFromSecret }}
    envFrom:
      - secretRef:
          name: {{ tpl .Values.plutono.envFromSecret . }}
    {{- end }}
    {{- if .Values.plutono.envRenderSecret }}
    envFrom:
      - secretRef:
          name: {{ template "plutono.fullname" . }}-env
    {{- end }}
    livenessProbe:
{{ toYaml .Values.plutono.livenessProbe | indent 6 }}
    readinessProbe:
{{ toYaml .Values.plutono.readinessProbe | indent 6 }}
    resources:
{{ toYaml .Values.plutono.resources | indent 6 }}
{{- with .Values.plutono.extraContainers }}
{{ tpl . $ | indent 2 }}
{{- end }}
{{- with .Values.plutono.nodeSelector }}
nodeSelector:
{{ toYaml . | indent 2 }}
{{- end }}
{{- with .Values.plutono.affinity }}
affinity:
{{ toYaml . | indent 2 }}
{{- end }}
{{- with .Values.plutono.tolerations }}
tolerations:
{{ toYaml . | indent 2 }}
{{- end }}
volumes:
  - name: config
    configMap:
      name: {{ template "plutono.fullname" . }}
{{- range .Values.plutono.extraConfigmapMounts }}
  - name: {{ .name }}
    configMap:
      name: {{ .configMap }}
{{- end }}
  {{- if .Values.plutono.dashboards }}
    {{- range (keys .Values.plutono.dashboards | sortAlpha) }}
  - name: dashboards-{{ . }}
    configMap:
      name: {{ template "plutono.fullname" $ }}-dashboards-{{ . }}
    {{- end }}
  {{- end }}
  {{- if .Values.plutono.dashboardsConfigMaps }}
    {{ $root := . }}
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
      secretName: {{ template "plutono.fullname" . }}
      {{- end }}
      items:
        - key: ldap-toml
          path: ldap.toml
  {{- end }}
{{- if and .Values.plutono.persistence.enabled (eq .Values.plutono.persistence.type "pvc") }}
  - name: storage
    persistentVolumeClaim:
      claimName: {{ .Values.plutono.persistence.existingClaim | default (include "plutono.fullname" .) }}
{{- else if and .Values.plutono.persistence.enabled (eq .Values.plutono.persistence.type "statefulset") }}
# nothing
{{- else }}
  - name: storage
{{- if .Values.plutono.persistence.inMemory.enabled }}
    emptyDir:
      medium: Memory
{{- if .Values.plutono.persistence.inMemory.sizeLimit }}
      sizeLimit: {{ .Values.plutono.persistence.inMemory.sizeLimit }}
{{- end -}}
{{- else }}
    emptyDir: {}
{{- end -}}
{{- end -}}
{{- if .Values.plutono.sidecar.dashboards.enabled }}
  - name: sc-dashboard-volume
    emptyDir: {}
{{- end }}
{{- if .Values.plutono.sidecar.datasources.enabled }}
  - name: sc-datasources-volume
    emptyDir: {}
{{- end -}}
{{- range .Values.plutono.extraSecretMounts }}
{{- if .secretName }}
  - name: {{ .name }}
    secret:
      secretName: {{ .secretName }}
      defaultMode: {{ .defaultMode }}
{{- else if .projected }}
  - name: {{ .name }}
    projected: {{- toYaml .projected | nindent 6 }}
{{- else if .csi }}
  - name: {{ .name }}
    csi: {{- toYaml .csi | nindent 6 }}
{{- end }}
{{- end }}
{{- range .Values.plutono.extraVolumeMounts }}
  - name: {{ .name }}
    {{- if .existingClaim }}
    persistentVolumeClaim:
      claimName: {{ .existingClaim }}
    {{- else if .hostPath }}
    hostPath:
      path: {{ .hostPath }}
    {{- else }}
    emptyDir: {}
    {{- end }}
{{- end }}
{{- range .Values.plutono.extraEmptyDirMounts }}
  - name: {{ .name }}
    emptyDir: {}
{{- end -}}
{{- if .Values.plutono.extraContainerVolumes }}
{{ toYaml .Values.plutono.extraContainerVolumes | indent 2 }}
{{- end }}
{{- end }}
