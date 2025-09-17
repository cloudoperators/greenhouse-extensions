{{- define "kvm.receiver" }}
filelog/qemu_logs:
  include: [ /var/log/libvirt/qemu/*.log ]
  include_file_path: true
  start_at: beginning
  multiline:
    line_start_pattern: ^\d{4}-\d{2}-\d{2}
  operators:
    - id: file-label
      type: add
      field: attributes["log.type"]
      value: "files-qemu"
filelog/openvswitch_logs:
  include: [ /var/log/openvswitch/*.log ]
  include_file_path: true
  start_at: beginning
  multiline:
    line_start_pattern: ^\d{4}-\d{2}-\d{2}
  operators:
    - type: regex_parser
      regex: (?P<logtime>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3})
    - type: time_parser
      parse_from: attributes.logtime
      layout: '%Y-%m-%dT%H:%M:%S.%L'
      layout_type: strptime
    - id: file-label
      type: add
      field: attributes["log.type"]
      value: "files-openvswitch"
filelog/kvm_monitoring:
  include: [ /var/log/pods/kvm-monitoring_*/monitoring/*.log ]
  include_file_path: true
  start_at: beginning
  multiline:
    line_start_pattern: ^\d{4}-\d{2}-\d{2}
  operators:
    - id: file-label
      type: add
      field: attributes["log.type"]
      value: "files-kvm-monitoring"
{{- end }}
{{- define "kvm.transform" }}
transform/kvm_openvswitch:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - resource.attributes["k8s.daemonset.name"] == "neutron-openvswitch-agent"
      statements:
        - merge_maps(log.attributes, ExtractGrokPatterns(log.body, "%{TIMESTAMP_ISO8601}%{SPACE}%{NUMBER:process.id}%{SPACE}%{WORD:log_level}%{SPACE}%{NOTSPACE:process.name}%{SPACE}\\[%{REQUEST_ID:request.id}%{SPACE}%{REQUEST_ID:request.global_id}", true, ["REQUEST_ID=([A-Za-z0-9-]+)"]), "upsert")
        - set(log.attributes["config.parsed"], "kvm_openvswitch") where log.attributes["log_level"] != nil

transform/kvm_nova_agent:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - resource.attributes["k8s.daemonset.name"] == "nova-hypervisor-agents-compute-kvm"
      statements:
        - merge_maps(log.attributes, ExtractGrokPatterns(log.body, "%{TIMESTAMP_ISO8601}%{SPACE}%{NUMBER:process.id}%{SPACE}%{WORD:log_level}%{SPACE}%{NOTSPACE:process.name}%{SPACE}\\[%{REQUEST_ID:request.id}%{SPACE}%{REQUEST_ID:request.global_id}", true, ["REQUEST_ID=([A-Za-z0-9-]+)"]), "upsert")
        - set(log.attributes["config.parsed"], "kvm_nova_agent") where log.attributes["log_level"] != nil

transform/kvm_logs:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - resource.attributes["log.type"] == "files"
      statements:
        - merge_maps(log.attributes, ExtractGrokPatterns(log.body, "%{TIMESTAMP_ISO8601:timestamp}%{SPACE}%{GREEDYDATA:log}",true), "upsert")
        - set(log.attributes["config.parsed"], "files") where log.attributes["log_level"] != nil

transform/qemu_logs:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - attributes["log.type"] == "files-qemu"
      statements:
        - set(log.attributes["config.parsed"], "qemu")
        - set(log.observed_time, Now())
        - set(log.time, log.observed_time)

transform/kvm_monitoring:
  error_mode: ignore
  log_statements:
    - context: log
      conditions:
        - attributes["log.type"] == "files-kvm-monitoring"
      statements:
        - merge_maps(log.attributes, ExtractPatterns(log.body, "level=(?P<loglevel>\\w+) msg=\"(?P<msg>[^\"]+)"), "upsert")
        - merge_maps(log.attributes, ExtractPatterns(log.body, "domain=(?P<domain>\\S+)"), "upsert")
        - merge_maps(log.attributes, ExtractPatterns(log.body, "runID=(?P<runID>\\S+)"), "upsert")
        - merge_maps(log.attributes, ExtractPatterns(log.body, "service_env=(?P<service_env>\\S+)"), "upsert")
        - merge_maps(log.attributes, ExtractPatterns(log.body, "service_name=(?P<service_name>\\S+)"), "upsert")
        - merge_maps(log.attributes, ExtractPatterns(log.body, "collector=\"(?P<collector>[^\"]+)"), "upsert")
        - set(log.attributes["config.parsed"], "kvm_monitoring") where log.attributes["loglevel"] != nil
        - set(log.observed_time, Now())
        - set(log.time, log.observed_time)
{{- end }}
{{- define "kvm.pipeline" }}
logs/kvm_containerd:
  receivers: [filelog/containerd]
  processors: [k8sattributes,attributes/cluster,transform/ingress,transform/kvm_openvswitch,transform/kvm_nova_agent]
  exporters: [forward]
logs/kvm_filelog:
  receivers: [filelog/qemu_logs,filelog/openvswitch_logs,filelog/kvm_monitoring]
  processors: [k8sattributes,attributes/cluster,transform/kvm_logs,transform/kvm_monitoring,transform/qemu_logs]
  exporters: [forward]
{{- end }}
