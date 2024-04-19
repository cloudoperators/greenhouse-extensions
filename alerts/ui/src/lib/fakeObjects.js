/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const refAlert = {
  annotations: {
    description:
      "vSphere High Availability (HA) has detected a possible host failure for `node014-bb164.cc.na-us-1.cloud.sap`. (vc-a-0.cc.na-us-1.cloud.sap).",
    summary:
      "vSphere High Availability (HA) has detected a possible host failure for `node014-bb164.cc.na-us-1.cloud.sap`. (vc-a-0.cc.na-us-1.cloud.sap).",
  },
  endsAt: "2023-06-21T13:04:01.855Z",
  fingerprint: "62cab9a4fd5732ee",
  receivers: [
    { name: "elastic" },
    { name: "awx" },
    { name: "pagerduty_compute" },
    { name: "octobus" },
    { name: "support_group_alerts_critical_compute" },
    { name: "pagerduty_vmware" },
    { name: "slack_vmware_critical" },
  ],
  startsAt: "2023-06-21T12:13:31.855Z",
  status: {
    inhibitedBy: [],
    silencedBy: [],
    state: "active",
  },
  updatedAt: "2023-06-21T13:00:01.969Z",
  generatorURL:
    "https://prometheus-vmware-vc-a-0.na-us-1.cloud.sap/graph?g0.expr=vrops_hostsystem_alert_info%7Balert_name%3D%22vSphere+High+Availability+%28HA%29+has+detected+a+possible+host+failure%22%7D+and+on+%28hostsystem%29+vrops_hostsystem_runtime_maintenancestate%7Bstate%21~%22inMaintenance%22%2Cvccluster%21~%22.%2Acontrolplane-swift%22%7D&g0.tab=1",
  labels: {
    alert_impact: "HEALTH",
    alert_level: "CRITICAL",
    alert_name:
      "vSphere High Availability (HA) has detected a possible host failure",
    alertname: "HADetectedAPossibleHostFailure",
    cluster: "s-na-us-1",
    cluster_type: "scaleout",
    collector: "vrops-vc-a-0-host",
    context: "node014-bb164.cc.na-us-1.cloud.sap failure",
    datacenter: "na-us-1a",
    description:
      "A vSphere HA master agent considers a host to have failed if it loses contact with the vSphere HA agent on the host, the host does not respond to pings on any of the management interfaces, and the master does not observe any datastore heartbeats. This problem can occur when a computer on the network is configured to have the same IP address as one of the ESX/ESXi hosts in a HA cluster. In this situation, the HA agent receives invalid data and generates errors. The HA agent does not function properly until it is reconfigured. The frequency of this problem depends on how often the IP address conflict occurs.",
    hostsystem: "node014-bb164.cc.na-us-1.cloud.sap",
    job: "vrops-exporter",
    meta: "vSphere High Availability (HA) has detected a possible host failure for `node014-bb164.cc.na-us-1.cloud.sap`. (vc-a-0.cc.na-us-1.cloud.sap).",
    no_alert_on_absence: "true",
    playbook: "docs/devops/alert/vcenter/#hadetectedapossiblehostfailure",
    prometheus: "vmware-monitoring/vmware-vc-a-0",
    recommendation_1:
      "Find the computer that has the duplicate IP address and reconfigure it to have a different IP address. This fault will be cleared and the alert canceled when the underlying problem is resolved and the vSphere HA master agent is able to connect to the HA agent on the host. NOTE: You can use the Duplicate IP warning in the /var/log/vmkernel log file on an ESX host or the /var/log/messages log file on an ESXi host to identify the computer that has the duplicate IP address.",
    region: "na-us-1",
    service: "compute",
    severity: "critical",
    status: "active",
    support_group: "compute",
    symptom_1_data:
      "{'condition': {'faultEvents': ['com.vmware.vc.HA.DasHostFailedEvent'], 'faultKey': 'fault|host|ha', 'type': 'CONDITION_FAULT'}, 'severity': 'CRITICAL'}",
    symptom_1_name: "vSphere HA detected a host failure",
    tier: "vmware",
    vccluster: "productionbb164",
    vcenter: "vc-a-0.cc.na-us-1.cloud.sap",
  },
}

const refAlertStatus = {
  inhibitedBy: [],
  silencedBy: [],
  state: "active",
}

const refSilence = {
  duration: "2",
  comment: "Test description",
  createdBy: "Jane Doe",
  status: {
    state: "active",
  },
  matchers: [
    { name: "cluster", value: "s-na-us-1", isRegex: false },
    { name: "cluster_type", value: "scaleout", isRegex: false },
    {
      name: "context",
      value: "node014-bb164.cc.na-us-1.cloud.sap failure",
      isRegex: false,
    },
    { name: "job", value: "vrops-exporter", isRegex: false },
    { name: "region", value: "na-us-1", isRegex: false },
    { name: "service", value: "compute", isRegex: false },
    { name: "severity", value: "critical", isRegex: false },
    { name: "support_group", value: "compute", isRegex: false },
    { name: "tier", value: "vmware", isRegex: false },
  ],
  startsAt: "2023-06-21T13:17:28.327Z",
  endsAt: "2023-06-21T15:17:28.327Z",
}

export const createFakeSilenceWith = (props = {}) => {
  return { ...refSilence, ...props }
}

export const createFakeAlertStatustWith = (props = {}) => {
  return { ...refAlertStatus, ...props }
}

export const createFakeAlertWith = (props = {}) => {
  return { ...refAlert, ...props }
}
