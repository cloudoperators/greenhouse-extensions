# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

# This file is the worker Deployment template consumed by the netappsd master
# (via --deployment-template). It is rendered in TWO layers:
#   1. Helm "tpl" (at chart install time) resolves all Values/Release/include
#      actions below.
#   2. The netappsd master (at runtime) fills the backtick-escaped Go-template
#      placeholders (.Name etc.) — one worker Deployment per discovered filer.
#      These are escaped so Helm passes them through verbatim, matching the
#      pattern used in harvest-netappsd-configmap.yaml.
#
# NOTE: The netappsd runtime placeholders below follow the master's
# --deployment-template field contract. Adjust the field names here if netappsd
# exposes them differently.
apiVersion: apps/v1
kind: Deployment
metadata:
  # netappsd runtime: per-filer deployment name
  name: {{`{{ .Name }}`}}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "netapp-monitoring.labels" . | nindent 4 }}
spec:
  selector:
    matchLabels:
      # netappsd runtime: per-filer pod identity
      name: {{`{{ .Name }}`}}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      annotations:
        kubectl.kubernetes.io/default-container: poller
        prometheus.io/scrape: "true"
        prometheus.io/targets: storage
        checksum/sd-config: {{ include "netapp-monitoring.checksum.configmap" . }}
        checksum/sd-secret: {{ include "netapp-monitoring.checksum.sdSecret" . }}
        checksum/basic-auth: {{ include "netapp-monitoring.checksum.basicAuthSecret" . }}
      labels:
        # Stable per-app label used by the worker Service selector (Helm-time).
        app: {{ include "netapp-monitoring.fullname" . }}-{{ .appName }}-worker
        # netappsd runtime: per-filer pod identity, filled by the master.
        name: {{`{{ .Name }}`}}
        {{- include "netapp-monitoring.additionalLabels" . | nindent 8 }}
    spec:
      serviceAccountName: {{ .Values.netappsd.serviceAccountName | default "netappsd" }}
      containers:
        - name: poller
          image: "{{ required ".Values.harvest.image.repository is required" .Values.harvest.image.repository }}:{{ required ".Values.harvest.image.tag is required" .Values.harvest.image.tag }}"
          imagePullPolicy: {{ .Values.harvest.image.pullPolicy | default "IfNotPresent" }}
          command: ["/busybox/sh"]
          args:
            - /app/scripts/start-poller.sh
          ports:
            - name: metrics
              containerPort: {{ .Values.netappsd.ports.harvest }}
          livenessProbe:
            httpGet:
              path: /health
              port: {{ .Values.netappsd.ports.harvest }}
            initialDelaySeconds: 60
            periodSeconds: 15
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: {{ .Values.netappsd.ports.harvest }}
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          resources:
            {{- toYaml .Values.harvest.resources | nindent 12 }}
          volumeMounts:
            - name: shared
              mountPath: /app/shared
            - name: harvest-sd-config
              mountPath: /app/scripts/start-poller.sh
              subPath: start-poller.sh
            - name: basic-auth
              mountPath: {{ required ".Values.netappsd.credentials_file is required" .Values.netappsd.credentials_file }}
              subPath: {{ required ".Values.netappsd.credentials_secret is required" .Values.netappsd.credentials_secret }}.yml
              readOnly: true
          securityContext:
            {{- toYaml .Values.harvest.securityContext | nindent 12 }}
        - name: netappsd-worker
          image: "{{ required ".Values.netappsd.image.repository is required" .Values.netappsd.image.repository }}:{{ required ".Values.netappsd.image.tag is required" .Values.netappsd.image.tag }}"
          imagePullPolicy: {{ .Values.netappsd.image.pullPolicy | default "IfNotPresent" }}
          command: ["/netappsd", "worker"]
          args:
            - --master-url
            - http://{{ include "netapp-monitoring.fullname" . }}-{{ .appName }}-master.{{ .Release.Namespace }}.svc:{{ .Values.netappsd.ports.master }}
            - --filer-name
            # netappsd runtime: master fills .Name with the discovered filer name.
            - {{`{{ .Name }}`}}
            - --listen-addr
            - :{{ .Values.netappsd.ports.worker }}
            - --template-file
            - /app/harvest.yaml.tpl
            - --output-file
            - /app/shared/harvest.yaml
          env:
            - name: NETAPP_USERNAME
              valueFrom:
                secretKeyRef:
                  name: {{ include "netapp-monitoring.fullname" . }}-sd
                  key: netappUsername
            - name: NETAPP_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "netapp-monitoring.fullname" . }}-sd
                  key: netappPassword
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          ports:
            - name: liveness
              containerPort: {{ .Values.netappsd.ports.worker }}
          resources:
            {{- toYaml .Values.netappsd.resources | nindent 12 }}
          volumeMounts:
            - name: harvest-sd-config
              mountPath: /app/harvest.yaml.tpl
              subPath: harvest.yaml.tpl
            - name: shared
              mountPath: /app/shared
      volumes:
        - name: harvest-sd-config
          configMap:
            name: {{ include "netapp-monitoring.fullname" . }}-sd-config
        - name: shared
          emptyDir: {}
        - name: basic-auth
          secret:
            secretName: {{ required ".Values.netappsd.credentials_secret is required" .Values.netappsd.credentials_secret }}
