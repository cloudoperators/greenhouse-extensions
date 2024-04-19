/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { renderHook, act } from "@testing-library/react"
import {
  useAlertsActions,
  useAlertEnrichedLabels,
  StoreProvider,
  useAlertsItemsFiltered,
} from "../hooks/useAppStore"

describe("createAlertsSlice", () => {
  describe("setEnrichedLabels", () => {
    it("return status as default", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useAlertsActions(),
          enrichedLabels: useAlertEnrichedLabels(),
        }),
        { wrapper }
      )
      expect(store.result.current.enrichedLabels).toEqual(["status"])
    })
  })

  describe("setFilteredItems", () => {
    it("return empty array as default", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useAlertsActions(),
          itemsFiltered: useAlertsItemsFiltered(),
        }),
        { wrapper }
      )
      expect(store.result.current.itemsFiltered).toEqual([])
    })

    it("accepts and transforms to array of strings coma separated strings containing the labels to use", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useAlertsActions(),
          itemsFiltered: useAlertsItemsFiltered(),
        }),
        { wrapper }
      )

      let mock

      act(() => {
        store.result.current.actions.setFilteredItems(mock)
      })

      expect(store.result.current.enrichedLabels).toEqual(mock)
    })
  })
})

/**
 * {
    "action": "ALERTS_UPDATE",
    "alerts": [
        {
            "annotations": {
                "description": "storage paths for `node003-bb322.cc.eu-de-1.cloud.sap` is less than other hosts in the `productionbb322`. (vc-d-4.cc.eu-de-1.cloud.sap)",
                "summary": "storage paths for `node003-bb322.cc.eu-de-1.cloud.sap` is less than other hosts in the `productionbb322`. (vc-d-4.cc.eu-de-1.cloud.sap)"
            },
            "endsAt": "2023-11-01T08:29:10.787Z",
            "fingerprint": "662491f9dd5bc5eb",
            "receivers": [
                {
                    "name": "elastic"
                },
                {
                    "name": "awx"
                },
                {
                    "name": "octobus"
                },
                {
                    "name": "slack_vmware_info"
                }
            ],
            "startsAt": "2023-10-23T09:29:40.787Z",
            "status": {
                "inhibitedBy": [],
                "silencedBy": [
                    "ed08c9ff-898a-49c9-9621-35f38191462e"
                ],
                "state": "suppressed"
            },
            "updatedAt": "2023-11-01T08:25:11.606Z",
            "generatorURL": "https://prometheus-vmware-vc-d-4.eu-de-1.cloud.sap/graph?g0.expr=vrops_hostsystem_storage_number_of_path+%3C+on+%28vccluster%29+group_left+%28%29+%28max+by+%28vccluster%29+%28vrops_hostsystem_storage_number_of_path%29%29&g0.tab=1",
            "labels": {
                "alertname": "HostStoragePathCheck",
                "cluster": "s-eu-de-1",
                "cluster_type": "scaleout",
                "collector": "vrops-vc-d-4-host",
                "context": "node003-bb322.cc.eu-de-1.cloud.sap storage paths",
                "datacenter": "eu-de-1d",
                "hostsystem": "node003-bb322.cc.eu-de-1.cloud.sap",
                "internal_name": "host-120240",
                "job": "vrops-exporter",
                "meta": "storage paths for `node003-bb322.cc.eu-de-1.cloud.sap` is less than other hosts in the `productionbb322`. (vc-d-4.cc.eu-de-1.cloud.sap)",
                "no_alert_on_absence": "true",
                "prometheus": "vmware-monitoring/vmware-vc-d-4",
                "region": "eu-de-1",
                "service": "compute",
                "severity": "info",
                "support_group": "compute",
                "tier": "vmware",
                "vccluster": "productionbb322",
                "vcenter": "vc-d-4.cc.eu-de-1.cloud.sap",
                "status": "suppressed"
            }
        },
        {
            "annotations": {
                "description": "The certificate for kubevirt-operator-webhook,kubevirt-operator-webhook.kubevirt,kubevirt-operator-webhook.kubevirt.svc,kubevirt-operator-webhook.kubevirt.svc.cluster.local expires in 417ms. See secret kubevirt/kubevirt-operator-certs, key tls.crt.",
                "summary": "Certificate expires"
            },
            "endsAt": "2023-11-01T08:29:52.979Z",
            "fingerprint": "dcff442a4c5301b6",
            "receivers": [
                {
                    "name": "elastic"
                }
            ],
            "startsAt": "2023-10-04T09:49:52.979Z",
            "status": {
                "inhibitedBy": [
                    "82b6187e7c363b9a"
                ],
                "silencedBy": [],
                "state": "suppressed"
            },
            "updatedAt": "2023-11-01T08:25:52.998Z",
            "generatorURL": "https://prometheus-kubernetes.qa-de-6.cloud.sap/graph?g0.expr=%28secrets_exporter_certificate_not_after+-+time%28%29%29+%2F+60+%2F+60+%2F+24+%3C%3D+30&g0.tab=1",
            "labels": {
                "alertname": "CertificateExpiresIn30Days",
                "app": "k8s-secrets-certificate-exporter",
                "ccloud_support_group": "observability",
                "cluster": "qa-de-6",
                "cluster_type": "metal",
                "context": "availability",
                "host": "kubevirt-operator-webhook,kubevirt-operator-webhook.kubevirt,kubevirt-operator-webhook.kubevirt.svc,kubevirt-operator-webhook.kubevirt.svc.cluster.local",
                "instance": "100.90.11.32:9091",
                "job": "pods",
                "key": "tls.crt",
                "kubernetes_namespace": "kube-monitoring",
                "kubernetes_pod_name": "k8s-secrets-certificate-exporter-664b7d4d68-p28hp",
                "metrics_path": "/metrics",
                "pod_template_hash": "664b7d4d68",
                "prometheus": "kube-monitoring/collector-kubernetes",
                "region": "qa-de-6",
                "secret": "kubevirt/kubevirt-operator-certs",
                "service": "certificates",
                "severity": "info",
                "support_group": "containers",
                "tier": "k8s",
                "status": "suppressed"
            }
        }
    ],
    "counts": {
        "global": {
            "total": 3469,
            "critical": 84,
            "warning": 281,
            "info": 3088,
            "none": 16
        },
        "regions": {
            "eu-de-2": {
                "total": 640,
                "critical": {
                    "total": 7,
                    "suppressed": 3
                },
                "warning": {
                    "total": 51,
                    "suppressed": 6
                },
                "info": {
                    "total": 578,
                    "suppressed": 5
                },
                "none": {
                    "total": 4
                }
            },
            "qa-de-1": {
                "total": 393,
                "critical": {
                    "total": 46
                },
                "warning": {
                    "total": 28,
                    "suppressed": 12
                },
                "info": {
                    "total": 319,
                    "suppressed": 38
                }
            },
            "ap-au-1": {
                "total": 169,
                "critical": {
                    "total": 11,
                    "suppressed": 2
                },
                "warning": {
                    "total": 34,
                    "suppressed": 8
                },
                "info": {
                    "total": 124,
                    "suppressed": 3
                }
            },
            "qa-de-3": {
                "total": 65,
                "critical": {
                    "total": 1
                },
                "warning": {
                    "total": 6
                },
                "info": {
                    "total": 58
                }
            },
            "ap-cn-1": {
                "total": 173,
                "critical": {
                    "total": 9,
                    "suppressed": 9
                },
                "warning": {
                    "total": 35,
                    "suppressed": 6
                },
                "info": {
                    "total": 126,
                    "suppressed": 1
                },
                "none": {
                    "total": 3
                }
            },
            "eu-de-1": {
                "total": 415,
                "critical": {
                    "total": 3,
                    "suppressed": 3
                },
                "warning": {
                    "total": 29,
                    "suppressed": 1
                },
                "info": {
                    "total": 383,
                    "suppressed": 45
                }
            },
            "na-us-1": {
                "total": 273,
                "critical": {
                    "total": 3,
                    "suppressed": 3
                },
                "warning": {
                    "total": 18
                },
                "info": {
                    "total": 252,
                    "suppressed": 16
                }
            },
            "eu-nl-1": {
                "total": 185,
                "critical": {
                    "total": 1,
                    "suppressed": 1
                },
                "warning": {
                    "total": 6
                },
                "info": {
                    "total": 178,
                    "suppressed": 2
                }
            },
            "na-us-2": {
                "total": 148,
                "critical": {
                    "total": 1,
                    "suppressed": 1
                },
                "warning": {
                    "total": 4
                },
                "info": {
                    "total": 143,
                    "suppressed": 1
                }
            },
            "ap-sa-1": {
                "total": 114,
                "critical": {
                    "total": 2,
                    "suppressed": 2
                },
                "warning": {
                    "total": 2,
                    "suppressed": 2
                },
                "info": {
                    "total": 110,
                    "suppressed": 1
                }
            },
            "qa-de-2": {
                "total": 48,
                "warning": {
                    "total": 4
                },
                "info": {
                    "total": 44
                }
            },
            "qa-de-6": {
                "total": 58,
                "warning": {
                    "total": 12
                },
                "info": {
                    "total": 46,
                    "suppressed": 10
                }
            },
            "ap-sa-2": {
                "total": 115,
                "warning": {
                    "total": 22
                },
                "info": {
                    "total": 93,
                    "suppressed": 1
                }
            },
            "ap-ae-1": {
                "total": 124,
                "warning": {
                    "total": 10,
                    "suppressed": 6
                },
                "info": {
                    "total": 111,
                    "suppressed": 1
                },
                "none": {
                    "total": 3
                }
            },
            "na-us-3": {
                "total": 144,
                "warning": {
                    "total": 1
                },
                "info": {
                    "total": 143,
                    "suppressed": 1
                }
            },
            "ap-jp-1": {
                "total": 133,
                "warning": {
                    "total": 11,
                    "suppressed": 6
                },
                "info": {
                    "total": 119,
                    "suppressed": 1
                },
                "none": {
                    "total": 3
                }
            },
            "la-br-1": {
                "total": 85,
                "warning": {
                    "total": 1
                },
                "info": {
                    "total": 84,
                    "suppressed": 1
                }
            },
            "na-ca-1": {
                "total": 94,
                "warning": {
                    "total": 1,
                    "suppressed": 1
                },
                "info": {
                    "total": 93,
                    "suppressed": 1
                }
            },
            "ap-jp-2": {
                "total": 93,
                "warning": {
                    "total": 6,
                    "suppressed": 6
                },
                "info": {
                    "total": 84,
                    "suppressed": 1
                },
                "none": {
                    "total": 3
                }
            }
        }
    }
}
 * 
 */
