{{- define "auditd.initContainer" }}
initContainers:
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
    ## PCI-DSS v3.1 10.2.2 - Privilege escalation via sudoers config changes
    - "-a always,exit -F path=/host/etc/sudoers -F perm=wa -F key=10.2.2-priv-config-changes"
    - "-a always,exit -F dir=/host/etc/sudoers.d/ -F perm=wa -F key=10.2.2-priv-config-changes"

    ## PCI-DSS v3.1 10.2.3 - Access to audit trails via privileged commands
    - "-a always,exit -F path=/host/usr/bin/aulast -F perm=x -F key=10.2.3-access-audit-trail"
    - "-a always,exit -F path=/host/usr/bin/auvirt -F perm=x -F key=10.2.3-access-audit-trail"

    ## PCI-DSS v3.1 10.2.5.b - Elevation of privileges
    - "-a always,exit -F arch=b64 -S setuid -F a0=0 -F exe=/usr/bin/su -F key=10.2.5.b-elevated-privs-session"
    - "-a always,exit -F arch=b32 -S setuid -F a0=0 -F exe=/usr/bin/su -F key=10.2.5.b-elevated-privs-session"
    - "-a always,exit -F arch=b64 -S setresuid -F a0=0 -F exe=/usr/bin/sudo -F key=10.2.5.b-elevated-privs-session"
    - "-a always,exit -F arch=b32 -S setresuid -F a0=0 -F exe=/usr/bin/sudo -F key=10.2.5.b-elevated-privs-session"
    - "-a always,exit -F arch=b64 -S execve -C uid!=euid -F euid=0 -F key=10.2.5.b-elevated-privs-setuid"
    - "-a always,exit -F arch=b32 -S execve -C uid!=euid -F euid=0 -F key=10.2.5.b-elevated-privs-setuid"

    ## PCI-DSS v3.1 10.2.5.c - Account modifications (group, passwd, shadow)
    - "-a always,exit -F path=/host/etc/group -F perm=wa -F key=10.2.5.c-accounts"
    - "-a always,exit -F path=/host/etc/passwd -F perm=wa -F key=10.2.5.c-accounts"
    - "-a always,exit -F path=/host/etc/gshadow -F perm=wa -F key=10.2.5.c-accounts"
    - "-a always,exit -F path=/host/etc/shadow -F perm=wa -F key=10.2.5.c-accounts"
    - "-a always,exit -F path=/host/etc/security/opasswd -F perm=wa -F key=10.2.5.c-accounts"

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
  processors: [attributes/auditd_logs,k8s_attributes,attributes/cluster]
  exporters: [routing]
{{- end }}
