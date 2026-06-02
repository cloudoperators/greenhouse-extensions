# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

{{/*
Shared Rego libraries inlined into every ConstraintTemplate.

  add_support_labels: annotates violation messages with the
    greenhouse.sap/owned-by label so reports can be routed to the right team.

  traversal: walks the Kubernetes ownership chain (Pod, ReplicaSet,
    Deployment, etc.) so policies can target the workload owner instead of
    the synthesized Pod.
*/}}

{{- define "gatekeeper-config.lib.add_support_labels" -}}
package lib.add_support_labels

# `obj` must be a full Kubernetes object.
from_k8s_object(obj, msg) := result if {
	owned_by := object.get(obj, ["metadata", "labels", "greenhouse.sap/owned-by"], "none")
	result := sprintf("{\"owned_by\":%s} >> %s", [json.marshal(owned_by), msg])
}

# `body` must be the response body from helm-manifest-parser
from_helm_release(body, msg) := result if {
	owned_by := object.get(body, ["owner_info", "owned-by"], "none")
	result := sprintf("{\"owned_by\":%s} >> %s", [json.marshal(owned_by), msg])
}

# Adds an additional label to a message that already had support labels added with one of the above methods.
extra(key, value, msg) := result if {
	result := sprintf("{%s:%s,%s", [json.marshal(key), json.marshal(value), trim_prefix(msg, "{")])
}
{{- end }}

{{- define "gatekeeper-config.lib.traversal" -}}
package lib.traversal

default find_pod(obj) := {"isFound": false}

find_pod(obj) := result if {
	obj.kind == "Pod"
	result := __return_pod_unless_suppressed(obj, __list_suppressing_owners(obj))
}

find_pod(obj) := result if {
	obj.kind != "Pod"
	location := object.get(__pod_template_locations, [obj.kind], [])
	location != []
	pod := object.get(obj, location, {})
	result := __return_pod_unless_suppressed(pod, __list_suppressing_owners(obj))
}

find_container_specs(obj) := result if {
	result := __extract_container_specs(find_pod(obj))
}

__pod_template_locations := {
	"CronJob": ["spec", "jobTemplate", "spec", "template"],
	"DaemonSet": ["spec", "template"],
	"Deployment": ["spec", "template"],
	"Job": ["spec", "template"],
	"ReplicaSet": ["spec", "template"],
	"StatefulSet": ["spec", "template"],
}

__suppressing_owner_kinds := {
	"Job": ["CronJob"],
	"Pod": ["DaemonSet", "Job", "ReplicaSet", "StatefulSet"],
	"ReplicaSet": ["Deployment"],
}

__list_suppressing_owners(obj) := result if {
	possible_owners := object.get(__suppressing_owner_kinds, [obj.kind], [])
	result := [ref.kind |
		ref := obj.metadata.ownerReferences[_]
		ref.kind == possible_owners[_]
	]
}

__return_pod_unless_suppressed(obj, owners) := result if {
	count(owners) > 0
	result := {"isFound": false}
}

__return_pod_unless_suppressed(obj, owners) := result if {
	count(owners) == 0
	result := object.union(obj, {"isFound": true})
}

__extract_container_specs(pod) := [] if {
	not pod.isFound
}

__extract_container_specs(pod) := result if {
	pod.isFound
	result := array.concat(
		object.get(pod.spec, "containers", []),
		object.get(pod.spec, "initContainers", []),
	)
}
{{- end }}
