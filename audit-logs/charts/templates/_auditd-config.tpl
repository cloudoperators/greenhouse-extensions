{{- define "auditd.initContainer" }}
- name: init
  image: alpine:latest
  securityContext:
    privileged: true
  command:
    - sh
    - -c
  args:
    - |-
      chroot /host systemctl status auditd
      chroot /host systemctl stop auditd
      chroot /host systemctl disable auditd
      chroot /host systemctl status auditd
      echo "done"
  volumeMounts:
    - name: host
      mountPath: "/host"
  env:
    - name: NODE
      valueFrom:
        fieldRef:
          fieldPath: spec.nodeName
{{ end }}

{{- define "auditd.volumeMounts" }}
- name: host
  mountPath: "/host"
  readOnly: true
{{ end }}

{{- define "auditd.volumes" }}
- name: host
  hostPath:
    path: "/"
{{ end }}

{{- define "auditd.receiver" }}
auditd/auditd_logs:
  rules:
    - "-a always,exit -F path=/host/etc/group -F perm=wa"
    - "-a always,exit -F path=/host/etc/passwd -F perm=wa"
    - "-a always,exit -F path=/host/etc/gshadow -F perm=wa"
    - "-a always,exit -F path=/host/etc/shadow -F perm=wa"
    - "-a always,exit -F path=/host/etc/sudoers -F perm=wa"
    - "-a always,exit -F dir=/host/etc/sudoers.d/ -F perm=wa"
    - "-a always,exit -F arch=b64 -S setuid -F a0=0 -F exe=/usr/bin/su"
    - "-a always,exit -F arch=b32 -S setuid -F a0=0 -F exe=/usr/bin/su"
    - "-a always,exit -F arch=b64 -S setresuid -F a0=0 -F exe=/usr/bin/sudo"
    - "-a always,exit -F arch=b32 -S setresuid -F a0=0 -F exe=/usr/bin/sudo"
    - "-a always,exit -F arch=b64 -S execve -C uid!=euid -F euid=0"
    - "-a always,exit -F arch=b32 -S execve -C uid!=euid -F euid=0"
    
{{ end }}

{{- define "auditd.processors" }}
attributes/auditd_logs:
  actions:
    - action: insert
      key: log.type
      value: "auditd"
{{ end }}

{{- define "auditd.pipelines" }}
logs/auditd_logs:
  receivers: [auditd/auditd_logs]
  processors: [attributes/auditd_logs,k8sattributes,attributes/cluster]
  exporters: [forward]
{{- end }}

