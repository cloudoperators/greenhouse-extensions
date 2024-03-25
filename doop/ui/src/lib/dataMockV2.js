/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  cluster_identities: {
    "cluster-1": { layer: "layer-1", type: "type-1" },
    "cluster-2": { layer: "layer-1", type: "type-1" },
    "cluster-3": { layer: "layer-1", type: "type-1" },
    "cluster-4": { layer: "layer-1", type: "type-1" },
    "cluster-5": { layer: "layer-1", type: "type-1" },
    "cluster-6": { layer: "layer-1", type: "type-1" },
    "cluster-7": { layer: "layer-1", type: "type-1" },
    "cluster-8": { layer: "layer-1", type: "type-2" },
    "cluster-9": { layer: "layer-2", type: "type-2" },
    "cluster-10": { layer: "layer-1", type: "type-3" },
    "cluster-11": { layer: "layer-1", type: "type-3" },
    "cluster-12": { layer: "layer-1", type: "type-3" },
    "cluster-13": { layer: "layer-1", type: "type-1" },
    "cluster-14": { layer: "layer-1", type: "type-1" },
    "cluster-15": { layer: "layer-1", type: "type-1" },
  },
  templates: [
    {
      kind: "kind-1",
      constraints: [
        {
          name: "const-1",
          metadata: {
            severity: "error",
            template_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper/templates/constrainttemplate-owner-info-on-helm-releases.yaml",
            constraint_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper-config/templates/constraint-owner-info-on-helm-releases.yaml",
            docstring:
              "gfhgddg jhfghjff\n\n#### hgfhgdghdgd\n\nhghfhjfjhfjf jhgjhjhg jhgjhgjhgjh ututuytuyt",
          },
          violation_groups: [
            {
              pattern: {
                kind: "violation-kind-1",
                name: "violation-group-1",
                namespace: "nms-1",
                message:
                  "hgfhgdfhgdfhg jhfghfhgf. jhfhgfhgfhgf uiyuiy mnbnmnvbnv lkjklj.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ name: "violation-group-1.v1", cluster: "qa-de-3" }],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "violation-group-2",
                namespace: "nms-2",
                message:
                  "nbvnbvnbv mnmnbnm mnbmnbn. jhgjhg oioi rtetrew nbvnbvnbv nbnvbvbv.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                { name: "violation-group-2.v1", cluster: "cluster-13" },
              ],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "violation-group-3",
                namespace: "nms-2",
                message:
                  "gfhgfhgfgf hgjhg jhjghjhg. iuiou ewrewer oioiiu nbmnbnb ghhghgjh.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                { name: "violation-group-3.v1", cluster: "s-cluster-13" },
              ],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "violation-group-4",
                namespace: "cc3test",
                message:
                  "gfhgfhgfgf hgjhg jhjghjhg. iuiou ewrewer oioiiu nbmnbnb ghhghgjh.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                { name: "violation-group-4.v1", cluster: "cluster-3" },
                { name: "violation-group-4.v12", cluster: "cluster-2" },
                { name: "violation-group-4.v15", cluster: "cluster-10" },
                { name: "violation-group-4.v2", cluster: "cluster-5" },
                { name: "violation-group-4.v2", cluster: "cluster-7" },
                { name: "violation-group-4.v4", cluster: "cluster-4" },
                { name: "violation-group-4.v5", cluster: "cluster-6" },
                { name: "violation-group-4.v5", cluster: "cluster-13" },
                { name: "violation-group-4.v8", cluster: "cluster-1" },
                { name: "violation-group-4.v8", cluster: "cluster-8" },
              ],
            },
          ],
        },
      ],
    },
    {
      kind: "kind-2",
      constraints: [
        {
          name: "const-2",
          metadata: {
            severity: "error",
            template_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper/templates/constrainttemplate-images-from-non-keppel.yaml",
            constraint_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper-config/templates/constraint-images-from-non-keppel.yaml",
            docstring:
              "hgfhgf hghghg ytuyt nmnmn ukj.\n\n#### nghgfhgfhgfghfd hgfhgf bvc?\n\nnvvv jghjhgjhg hgjhgjhg hhghghjg uyutyyut. jhgjhgjhg hgjhghgf jhgjhgjh jhjhgjhg oiou reerwew dsfds.\njhgjhghjg hvhgfhgf bvbvcbvcbvc nbvv uyuyiuy mnbmnbnmb mnbnb\nmnbmnbmnb nbvnbvnbv nbvnbvnb.",
          },
          violation_groups: [
            {
              pattern: {
                kind: "violation-kind-2",
                name: "violation-group-4",
                namespace: "kube-system",
                message:
                  'container "perses" uses an image that is not from a Keppel registry: persesdev/perses:v0.39.0',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "cluster-1" }],
            },
          ],
        },
      ],
    },
    {
      kind: "kind-3",
      constraints: [
        {
          name: "const-3",
          metadata: {
            severity: "debug",
            template_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper/templates/constrainttemplate-forbidden-clusterwide-objects.yaml",
            constraint_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper-config/templates/constraint-forbidden-clusterwide-objects.yaml",
          },
          violation_groups: [
            {
              pattern: {
                kind: "vilation-group-kind-3",
                name: "violation-group-1",
                message:
                  "hgjhghg jkhjg jhhgjhg uytuyt wiuiiu poipoipi oioiuu mnbnbn.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "cluster-5" }, { cluster: "cluster-6" }],
            },
            {
              pattern: {
                kind: "violation-group--kind-4",
                name: "violation-group-2",
                message:
                  "hghg ghghgfg bhghgfhgf hvhgfhgf nvhgffhgf bvvbv gfhgfhgf bvbvbvc.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "cluster-10" }, { cluster: "cluster-5" }],
            },
            {
              pattern: {
                kind: "violation-group-kind-5",
                name: "violation-group-3",
                message:
                  "hjjhjh mhjhj jhgjhgjhg bmnbmnbnm jhjgjg bmnbmnbnmb nhghjg bnbmnbmb mbnnb mbnmb.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "cluster-7" }, { cluster: "cluster-12" }],
            },
            {
              pattern: {
                kind: "violation-group-kind-6",
                name: "violation-group-4",
                message:
                  "nvvgfhgf hgfhghgf hgfhgfhgf hgfhgfghf hgftt bvbvcvbnv bvbcbvc vbnvnby ghjhgh jhhg.",
                object_identity: {
                  service: "none",
                  support_group: "support-group-1",
                },
              },
              instances: [{ cluster: "cluster-1" }, { cluster: "cluster-2" }],
            },
          ],
        },
      ],
    },
    {
      kind: "kind-4",
      constraints: [
        {
          name: "const-4",
          metadata: {
            severity: "info",
            template_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper/templates/constrainttemplate-images-from-correct-registry.yaml",
            constraint_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper-config/templates/constraint-images-from-correct-registry.yaml",
            docstring:
              "gffgfgf gfhgfb vbmb njyutt nbvnvbnvb uytuyt bvbvbvc nbvnbvnbv.\n\n#### nbbnvnbv nbvnbvnbv nbvnbvnbv?\n\nRbcvcvcbvc bvbvcbvc bvbvcbcvbvc bvnbvnbv nhgfhgfhgf vbvbncvbvc hgfhgfghf bvbvcbvcbvc.",
          },
          violation_groups: [
            {
              pattern: {
                kind: "Deployment",
                name: "grafana-deployment",
                namespace: "\u003cnms-2\u003e",
                message:
                  'container "grafana-plugins-init" uses incorrect regional registry for image: grafana_plugins_init:0.0.2',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  namespace: "184f96ee29874bb488574a0fc130b094",
                  cluster: "s-cluster-1",
                },
                {
                  namespace: "28aaffddf32c41518f02ed5ff31a9869",
                  cluster: "s-cluster-3",
                },
                {
                  namespace: "32171b8fa5604a55a7aa1b815c56b1d7",
                  cluster: "s-la-br-1",
                },
                {
                  namespace: "4cbc86cb19784dcf8505877697fc8852",
                  cluster: "s-na-ca-1",
                },
                {
                  namespace: "4df71e148120419da44b244dc0f7409c",
                  cluster: "s-cluster-4",
                },
              ],
            },
            {
              pattern: {
                kind: "StatefulSet",
                name: "prometheus-infra-frontend",
                namespace: "infra-monitoring",
                message:
                  'container "prometheus" uses incorrect regional registry for image: prometheus:v2.39.1',
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
              ],
            },
            {
              pattern: {
                kind: "StatefulSet",
                name: "prometheus-storage",
                namespace: "infra-monitoring",
                message:
                  'container "config-reloader" uses incorrect regional registry for image: prometheus-config-reloader:v0.68.0',
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "cluster-1" },
                { cluster: "cluster-2" },
                { cluster: "cluster-3" },
                { cluster: "cluster-4" },
                { cluster: "cluster-5" },
                { cluster: "cluster-6" },
                { cluster: "cluster-7" },
                { cluster: "la-br-1" },
                { cluster: "na-ca-1" },
                { cluster: "na-us-1" },
                { cluster: "na-us-2" },
                { cluster: "na-us-3" },
              ],
            },
            {
              pattern: {
                kind: "StatefulSet",
                name: "prometheus-storage",
                namespace: "infra-monitoring",
                message:
                  'container "init-config-reloader" uses incorrect regional registry for image: prometheus-config-reloader:v0.68.0',
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "cluster-1" },
                { cluster: "cluster-2" },
                { cluster: "cluster-3" },
                { cluster: "cluster-4" },
                { cluster: "cluster-5" },
                { cluster: "cluster-6" },
                { cluster: "cluster-7" },
                { cluster: "la-br-1" },
                { cluster: "na-ca-1" },
                { cluster: "na-us-1" },
                { cluster: "na-us-2" },
                { cluster: "na-us-3" },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "grafana-deployment-\u003cvariable\u003e",
                namespace: "\u003cvariable\u003e",
                message:
                  'image keppel.cluster-13.cloud.sap/ccloud/grafana_plugins_init:0.0.2 for container "grafana-plugins-init" uses a very old base image (oldest layer is 1244 days old)',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "grafana-deployment-58cc88888f-tjqpj",
                  namespace: "184f96ee29874bb488574a0fc130b094",
                  cluster: "s-cluster-1",
                },
                {
                  name: "grafana-deployment-55c5f5b999-r2967",
                  namespace: "28aaffddf32c41518f02ed5ff31a9869",
                  cluster: "s-cluster-3",
                },
                {
                  name: "grafana-deployment-59d54bb4d6-h5czd",
                  namespace: "32171b8fa5604a55a7aa1b815c56b1d7",
                  cluster: "s-la-br-1",
                },
                {
                  name: "grafana-deployment-845bc5bcb6-lb27c",
                  namespace: "4cbc86cb19784dcf8505877697fc8852",
                  cluster: "s-na-ca-1",
                },
                {
                  name: "grafana-deployment-59f8768768-4s67f",
                  namespace: "4df71e148120419da44b244dc0f7409c",
                  cluster: "s-cluster-4",
                },
                {
                  name: "grafana-deployment-5d4c886b68-859dh",
                  namespace: "6c233bdcc3f24e9dba6ba59995c18150",
                  cluster: "s-cluster-6",
                },
                {
                  name: "grafana-deployment-7587d6cd7-v9sld",
                  namespace: "734690bac5b747ca9267755c2dc025a3",
                  cluster: "s-cluster-1",
                },
                {
                  name: "grafana-deployment-67f4c7c4c9-gssmk",
                  namespace: "894b608ef74c4cd9b4ea34b078d7ba7d",
                  cluster: "s-na-us-3",
                },
                {
                  name: "grafana-deployment-77988889bd-7g6fq",
                  namespace: "8eba4efad678488b8816a39fd19a56ca",
                  cluster: "s-cluster-2",
                },
                {
                  name: "grafana-deployment-5cbf7f9444-smkdk",
                  namespace: "d49ce57b37a3402ab8028b186c08f2ca",
                  cluster: "s-na-us-1",
                },
                {
                  name: "grafana-deployment-6d7d884c4d-7qgjj",
                  namespace: "f4b76b9f83d84cf1b91c949b372ca4a9",
                  cluster: "s-na-us-2",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "grafana-proxy-deployment-\u003cvariable\u003e",
                namespace: "\u003cvariable\u003e",
                message:
                  'image keppel.\u003caltregion\u003e.cloud.sap/ccloud/dex:8373c31b3e2d96ad3a7313227aa1bb8c59ddca39 for container "grafana-proxy" uses a very old base image (oldest layer is 1658 days old)',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "grafana-proxy-deployment-6d4c5dc7c-7qtrj",
                  namespace: "0d08702cc5fe45a3ace5acdcb65e46eb",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/dex:8373c31b3e2d96ad3a7313227aa1bb8c59ddca39 for container "grafana-proxy" uses a very old base image (oldest layer is 1658 days old)',
                  cluster: "s-cluster-15",
                },
                {
                  name: "grafana-proxy-deployment-5fb8cfdf46-fq5w6",
                  namespace: "3e0fd3f8e9ec449686ef26a16a284265",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/dex:8373c31b3e2d96ad3a7313227aa1bb8c59ddca39 for container "grafana-proxy" uses a very old base image (oldest layer is 1658 days old)',
                  cluster: "s-cluster-15",
                },
                {
                  name: "grafana-proxy-deployment-5c59dd6c74-mng8z",
                  namespace: "aae327344a674b1cb781aa9ec7ecddab",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/dex:8373c31b3e2d96ad3a7313227aa1bb8c59ddca39 for container "grafana-proxy" uses a very old base image (oldest layer is 1658 days old)',
                  cluster: "s-cluster-14",
                },
                {
                  name: "grafana-proxy-deployment-7c5b559bf4-ldrxw",
                  namespace: "bf6877e6de1b4323973cba0889a1280f",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/dex:8373c31b3e2d96ad3a7313227aa1bb8c59ddca39 for container "grafana-proxy" uses a very old base image (oldest layer is 1658 days old)',
                  cluster: "s-cluster-15",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "oauth2-proxy-\u003cvariable\u003e",
                namespace: "global-auth-internal",
                message:
                  'image keppel.\u003cregion\u003e.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                object_identity: {
                  service: "oauth-proxy",
                  support_group: "containers",
                },
              },
              instances: [
                {
                  name: "oauth2-proxy-54d8567ddc-77v56",
                  message:
                    'image keppel.na-us-3.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "na-us-3",
                },
                {
                  name: "oauth2-proxy-54df9f5cf7-ltsd5",
                  message:
                    'image keppel.cluster-6.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "cluster-6",
                },
                {
                  name: "oauth2-proxy-57b897c7b8-2ljrm",
                  message:
                    'image keppel.cluster-15.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "cluster-15",
                },
                {
                  name: "oauth2-proxy-59ccfbb77f-j52jz",
                  message:
                    'image keppel.la-br-1.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "la-br-1",
                },
                {
                  name: "oauth2-proxy-64ddbb57d4-h64z9",
                  message:
                    'image keppel.cluster-5.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "cluster-5",
                },
                {
                  name: "oauth2-proxy-66bbf55dff-58xlr",
                  message:
                    'image keppel.cluster-2.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "cluster-2",
                },
                {
                  name: "oauth2-proxy-76886cf7b6-fl5nx",
                  message:
                    'image keppel.cluster-7.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "cluster-7",
                },
                {
                  name: "oauth2-proxy-7979644f7c-khg5f",
                  message:
                    'image keppel.na-ca-1.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "na-ca-1",
                },
                {
                  name: "oauth2-proxy-956644846-7v8wq",
                  message:
                    'image keppel.na-us-2.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "na-us-2",
                },
                {
                  name: "oauth2-proxy-d46677b98-wkdsm",
                  message:
                    'image keppel.cluster-3.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "cluster-3",
                },
                {
                  name: "oauth2-proxy-d9cfc5dc-f2fjd",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "qa-de-3",
                },
                {
                  name: "oauth2-proxy-d9cfc5dc-mwwdk",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "qa-de-2",
                },
                {
                  name: "oauth2-proxy-d9cfc5dc-x6s89",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "qa-de-1",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "oauth2-proxy-b6bf5d7-\u003cvariable\u003e",
                namespace: "global-auth-internal",
                message:
                  'image keppel.\u003cregion\u003e.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                object_identity: {
                  service: "oauth-proxy",
                  support_group: "containers",
                },
              },
              instances: [
                {
                  name: "oauth2-proxy-b6bf5d7-4dn8q",
                  message:
                    'image keppel.cluster-4.cloud.sap/ccloud-dockerhub-mirror/bitnami/oauth2-proxy:7.2.0 for container "oauth2-proxy" uses a very old base image (oldest layer is 645 days old)',
                  cluster: "cluster-4",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "ironic-db-migration-bxck-\u003cvariable\u003e",
                namespace: "monsoon3",
                message:
                  'image keppel.\u003cregion\u003e.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "ironic-db-migration-bxck-tw8lg",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                  cluster: "qa-de-2",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "ironic-db-migration-cabl-\u003cvariable\u003e",
                namespace: "monsoon3",
                message:
                  'image keppel.\u003cregion\u003e.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "ironic-db-migration-cabl-xnmst",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                  cluster: "qa-de-2",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "ironic-db-migration-cb97-\u003cvariable\u003e",
                namespace: "monsoon3",
                message:
                  'image keppel.\u003cregion\u003e.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "ironic-db-migration-cb97-846rw",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                  cluster: "qa-de-2",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "ironic-db-migration-cifb-\u003cvariable\u003e",
                namespace: "monsoon3",
                message:
                  'image keppel.\u003cregion\u003e.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "ironic-db-migration-cifb-5jqpc",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud/kubernetes-entrypoint:v0.3.1 for container "kubernetes-entrypoint" uses a very old base image (oldest layer is 524 days old)',
                  cluster: "qa-de-2",
                },
              ],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "k8s-secrets-certificate-exporter",
                namespace: "kube-monitoring",
                message:
                  'container "k8s-secrets-certificate-exporter" uses image from obsolete mirror: keppel.global.cloud.sap/ccloud-dockerhub-mirror/sapcc/k8s-secrets-certificate-exporter:557ea2f',
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [
                { cluster: "cluster-1" },
                { cluster: "cluster-2" },
                { cluster: "cluster-4" },
                { cluster: "cluster-6" },
                { cluster: "cluster-8" },
                { cluster: "cluster-9" },
                { cluster: "cluster-10" },
                { cluster: "cluster-11" },
                { cluster: "cluster-12" },
                { cluster: "cluster-15" },
                { cluster: "i-cluster-14" },
                { cluster: "la-br-1" },
                { cluster: "qa-de-1" },
                { cluster: "qa-de-2" },
                { cluster: "qa-de-3" },
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "k8s-secrets-certificate-exporter",
                namespace: "kube-monitoring",
                message:
                  'container "k8s-secrets-certificate-exporter" uses image from obsolete mirror: keppel.global.cloud.sap/ccloud-dockerhub-mirror/sapcc/k8s-secrets-certificate-exporter:557ea2f',
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "cluster-3" },
                { cluster: "cluster-5" },
                { cluster: "cluster-7" },
                { cluster: "cluster-13" },
                { cluster: "cluster-14" },
                { cluster: "na-ca-1" },
                { cluster: "na-us-1" },
                { cluster: "na-us-2" },
                { cluster: "na-us-3" },
                { cluster: "qa-de-6" },
              ],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "disco",
                namespace: "kube-system",
                message:
                  'container "disco" uses image from obsolete mirror: keppel.\u003cregion\u003e.cloud.sap/ccloud-dockerhub-mirror/sapcc/disco:v201910171439',
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [
                {
                  message:
                    'container "disco" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/disco:v201910171439',
                  cluster: "qa-de-6",
                },
              ],
            },
            {
              pattern: {
                kind: "DaemonSet",
                name: "kube-system-ldap-named-user",
                namespace: "kube-system",
                message:
                  'container "pause" uses image from obsolete mirror: keppel.\u003caltregion\u003e.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "cluster-8",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "cluster-10",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "cluster-11",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "cluster-12",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "i-cluster-14",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "s-cluster-14",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "s-cluster-15",
                },
              ],
            },
            {
              pattern: {
                kind: "DaemonSet",
                name: "kube-system-ldap-named-user",
                namespace: "kube-system",
                message:
                  'container "pause" uses image from obsolete mirror: keppel.\u003cregion\u003e.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "cluster-9",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "s-cluster-13",
                },
                {
                  message:
                    'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                  cluster: "s-qa-de-1",
                },
              ],
            },
            {
              pattern: {
                kind: "DaemonSet",
                name: "kube-system-ldap-named-user",
                namespace: "kube-system",
                message:
                  'container "pause" uses image from obsolete mirror: keppel.cluster-13.cloud.sap/ccloud-dockerhub-mirror/sapcc/pause-amd64:3.1',
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
              ],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "chaos-mesh",
                namespace: "chaos-mesh",
                message:
                  "gfhgfhgfgf hgjhg jhjghjhg. iuiou ewrewer oioiiu nbmnbnb ghhghgjh.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                { name: "chaos-mesh.v1", cluster: "qa-de-2" },
                { name: "chaos-mesh.v1", cluster: "qa-de-3" },
              ],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "cronus-exporter",
                namespace: "cronus",
                message:
                  "gfhgfhgfgf hgjhg jhjghjhg. iuiou ewrewer oioiiu nbmnbnb ghhghgjh.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ name: "cronus-exporter.v1", cluster: "qa-de-1" }],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "cronus-pushgateway",
                namespace: "cronus",
                message:
                  "gfhgfhgfgf hgjhg jhjghjhg. iuiou ewrewer oioiiu nbmnbnb ghhghgjh.",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                { name: "cronus-pushgateway.v16", cluster: "qa-de-2" },
              ],
            },
            {
              pattern: {
                kind: "Job",
                name: "ironic-db-migration-gzd2",
                namespace: "monsoon3",
                message:
                  "pod does not have the required label: ccloud/support-group",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "na-us-1" }],
            },
            {
              pattern: {
                kind: "Job",
                name: "ironic-db-migration-gzhm",
                namespace: "monsoon3",
                message:
                  "pod does not have the required label: ccloud/support-group",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "qa-de-1" }],
            },
            {
              pattern: {
                kind: "Job",
                name: "ironic-db-migration-hb4g",
                namespace: "monsoon3",
                message:
                  "pod does not have the required label: ccloud/support-group",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "qa-de-2" }],
            },
            {
              pattern: {
                kind: "Job",
                name: "ironic-db-migration-hbkh",
                namespace: "monsoon3",
                message:
                  "pod does not have the required label: ccloud/support-group",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "qa-de-2" }],
            },
            {
              pattern: {
                kind: "Job",
                name: "ironic-db-migration-hhbt",
                namespace: "monsoon3",
                message:
                  "pod does not have the required label: ccloud/support-group",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "qa-de-1" }],
            },
            {
              pattern: {
                kind: "Job",
                name: "ironic-db-migration-hjz9",
                namespace: "monsoon3",
                message:
                  "pod does not have the required label: ccloud/support-group",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "qa-de-1" }],
            },
          ],
        },
      ],
    },
    {
      kind: "GkPrometheusScrapeAnnotations",
      constraints: [
        {
          name: "prometheusscrapeannotations",
          metadata: {
            severity: "debug",
            template_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper/templates/constrainttemplate-prometheus-scrape-annotations.yaml",
            constraint_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper-config/templates/constraint-prometheus-scrape-annotations.yaml",
          },
          violation_groups: [
            {
              pattern: {
                kind: "Pod",
                name: "grafana-deployment-\u003cvariable\u003e",
                namespace: "\u003cvariable\u003e",
                message:
                  'has prometheus.io/scrape annotation, but prometheus.io/targets annotation is missing or does not have a valid value (got: [""], valid: ["infra-frontend","kubernetes","vmware-vc-a-0","vmware-vc-a-1","vmware-vc...',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "grafana-deployment-58cc88888f-tjqpj",
                  namespace: "184f96ee29874bb488574a0fc130b094",
                  cluster: "s-cluster-1",
                },
                {
                  name: "grafana-deployment-55c5f5b999-r2967",
                  namespace: "28aaffddf32c41518f02ed5ff31a9869",
                  cluster: "s-cluster-3",
                },
                {
                  name: "grafana-deployment-59f8768768-4s67f",
                  namespace: "4df71e148120419da44b244dc0f7409c",
                  cluster: "s-cluster-4",
                },
                {
                  name: "grafana-deployment-5d4c886b68-859dh",
                  namespace: "6c233bdcc3f24e9dba6ba59995c18150",
                  cluster: "s-cluster-6",
                },
                {
                  name: "grafana-deployment-7587d6cd7-v9sld",
                  namespace: "734690bac5b747ca9267755c2dc025a3",
                  cluster: "s-cluster-1",
                },
                {
                  name: "grafana-deployment-67f4c7c4c9-gssmk",
                  namespace: "894b608ef74c4cd9b4ea34b078d7ba7d",
                  cluster: "s-na-us-3",
                },
                {
                  name: "grafana-deployment-77988889bd-7g6fq",
                  namespace: "8eba4efad678488b8816a39fd19a56ca",
                  cluster: "s-cluster-2",
                },
                {
                  name: "grafana-deployment-65994d9cd9-5d267",
                  namespace: "91260d881eee49a68b437e441ebd5f0e",
                  cluster: "s-cluster-14",
                },
                {
                  name: "grafana-deployment-78cd497c5f-fcmrn",
                  namespace: "ba3fddd34b014b208e55a8047574fb60",
                  cluster: "s-cluster-13",
                },
                {
                  name: "grafana-deployment-5cbf7f9444-smkdk",
                  namespace: "d49ce57b37a3402ab8028b186c08f2ca",
                  cluster: "s-na-us-1",
                },
                {
                  name: "grafana-deployment-6d7d884c4d-7qgjj",
                  namespace: "f4b76b9f83d84cf1b91c949b372ca4a9",
                  cluster: "s-na-us-2",
                },
              ],
            },
            {
              pattern: {
                kind: "Pod",
                name: "grafana-deployment-\u003cvariable\u003e",
                namespace: "\u003cvariable\u003e",
                message:
                  'has prometheus.io/scrape annotation, but prometheus.io/targets annotation is missing or does not have a valid value (got: [""], valid: ["infra-frontend","kubernetes","vmware-vc-a-0","vmware-vc-b-0","vmware-vc...',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                {
                  name: "grafana-deployment-6b69ffd45-zz9dz",
                  namespace: "0d08702cc5fe45a3ace5acdcb65e46eb",
                  cluster: "s-cluster-15",
                },
                {
                  name: "grafana-deployment-7f9bd96d68-vsjsm",
                  namespace: "3946cfbc1fda4ce19561da1df5443c86",
                  cluster: "s-cluster-15",
                },
                {
                  name: "grafana-deployment-774c7dc64d-9pqgf",
                  namespace: "3e0fd3f8e9ec449686ef26a16a284265",
                  cluster: "s-cluster-15",
                },
                {
                  name: "grafana-deployment-845bc5bcb6-lb27c",
                  namespace: "4cbc86cb19784dcf8505877697fc8852",
                  cluster: "s-na-ca-1",
                },
                {
                  name: "grafana-deployment-78b89cf59-fwkfz",
                  namespace: "bf6877e6de1b4323973cba0889a1280f",
                  cluster: "s-cluster-15",
                },
                {
                  name: "grafana-deployment-764ff99df7-t74rd",
                  namespace: "dc8f53cbf2dc415c845a6d5d3b2ddba0",
                  cluster: "s-qa-de-1",
                },
              ],
            },
            {
              pattern: {
                kind: "Service",
                name: "concourse-ci3-web-prometheus",
                namespace: "type-3",
                message:
                  'has prometheus.io/scrape annotation, but prometheus.io/targets annotation is missing or does not have a valid value (got: [""], valid: ["kubernetes"])',
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [{ cluster: "cluster-12" }],
            },
            {
              pattern: {
                kind: "Service",
                name: "concourse-main-web-prometheus",
                namespace: "type-3",
                message:
                  'has prometheus.io/scrape annotation, but prometheus.io/targets annotation is missing or does not have a valid value (got: [""], valid: ["kubernetes"])',
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [{ cluster: "cluster-10" }],
            },
            {
              pattern: {
                kind: "Service",
                name: "cronus-exporter",
                namespace: "cronus",
                message:
                  'has prometheus.io/scrape annotation, but prometheus.io/targets annotation is missing or does not have a valid value (got: ["infra-frontend"], valid: ["collector-kubernetes","infra-collector","kubernetes","mai...',
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [{ cluster: "qa-de-1" }],
            },
            {
              pattern: {
                kind: "PrometheusRule",
                name: "cc3test-alerts-cc3test-absent.alerts",
                namespace: "cc3test",
                message:
                  "rule CC3TestScrapeDown in group cc3test-absent.alerts does not have labels.support_group",
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "PrometheusRule",
                name: "cc3test-alerts-cc3test-runtime.alerts",
                namespace: "cc3test",
                message:
                  "rule CC3TestApiTestsNotRunning in group cc3test-runtime.alerts does not have labels.support_group",
                object_identity: {
                  service: "cc3test",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "PrometheusRule",
                name: "cc3test-alerts-cc3test-runtime.alerts",
                namespace: "cc3test",
                message:
                  "rule CC3TestCertificateTestsNotRunning in group cc3test-runtime.alerts does not have labels.support_group",
                object_identity: {
                  service: "cc3test",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
          ],
        },
      ],
    },
    {
      kind: "GkRegionValueMissing",
      constraints: [
        {
          name: "regionvaluemissing",
          metadata: {
            severity: "warning",
            template_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper/templates/constrainttemplate-region-value-missing.yaml",
            constraint_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper-config/templates/constraint-region-value-missing.yaml",
            docstring:
              "This check finds Helm releases that do not set `.Values.global.region`.\n\n#### Why is this a problem?\n\nWe had some incidents where configuration for one region was accidentally deployed in a different region. The\nGkRegionValueMismatch check forbids such deployments, but for this check to be effective, we must be able to identify\nwhich region a Helm release belongs to.\n\n#### How to fix?\n\nAmend your deployment process to include the values file `$REGION/values/globals.yaml` or\n`scaleout/s-$REGION/values/globals.yaml` from the cc/secrets repo in your `helm upgrade` invocation. If you are using\nthe shared Helm tasks, this is done by adjusting the `VALUES` parameter to include `local:globals` (for metal) or\n`s-local:globals` (for scaleout).\n",
          },
          violation_groups: [
            {
              pattern: {
                kind: "violation-kind-1",
                name: "awx-operator",
                namespace: "awx",
                message: "missing or invalid .Values.global.region value",
                object_identity: { service: "awx", support_group: "compute" },
              },
              instances: [
                { name: "awx-operator.v18", cluster: "s-cluster-13" },
                { name: "awx-operator.v24", cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "awx-postgresql",
                namespace: "awx",
                message: "missing or invalid .Values.global.region value",
                object_identity: { service: "awx", support_group: "compute" },
              },
              instances: [
                { name: "awx-postgresql.v10", cluster: "s-qa-de-1" },
                { name: "awx-postgresql.v8", cluster: "s-cluster-13" },
              ],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "volta",
                namespace: "volta",
                message: "missing or invalid .Values.global.region value",
                object_identity: { service: "volta", support_group: "src" },
              },
              instances: [
                { name: "volta.v25", cluster: "cluster-13" },
                { name: "volta.v4", cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "violation-kind-1",
                name: "whois",
                namespace: "whois",
                message: "missing or invalid .Values.global.region value",
                object_identity: { service: "whois", support_group: "src" },
              },
              instances: [
                { name: "whois.v100", cluster: "s-cluster-15" },
                { name: "whois.v93", cluster: "s-cluster-13" },
              ],
            },
          ],
        },
      ],
    },
    {
      kind: "GkResourceLimits",
      constraints: [
        {
          name: "resourcelimits",
          metadata: {
            severity: "info",
            template_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper/templates/constrainttemplate-resource-limits.yaml",
            constraint_source:
              "https://github.com/sapcc/helm-charts/tree/master/system/gatekeeper-config/templates/constraint-resource-limits.yaml",
            docstring:
              'This check finds containers that do not have CPU and memory limits configured.\n\n#### Why is this a problem?\n\nSuch containers could use an unbounded amount of resources (for example, because of a memory leak). Those resources\nwould then not be available to other (potentially more important) containers running on the same node. We have already\nhad API outages because of this.\n\n#### How to fix?\n\nConfigure requests and limits for "cpu" and "memory" as described in [this article][doc]. Choose values based on\nhistorical usage, by looking at the `container_cpu_usage_seconds_total` and `container_memory_working_set_bytes` metrics\nin prometheus-kubernetes. The Grafana dashboard [Container Resources][dashboard] shows these metrics in the "CPU Usage"\nand "Memory Usage" panels. **Set the memory request equal to the memory limit to avoid unexpected scheduling behavior.**\nFor CPU, request and limit can and should diverge: The request represents the baseline load, the limit encompasses all\nexpected spikes.\n\n[doc]: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/\n[dashboard]: https://grafana.cluster-13.cloud.sap/d/kubernetes-container-resources/kubernetes-container-resources\n',
          },
          violation_groups: [
            {
              pattern: {
                kind: "Deployment",
                name: "andromeda-agent-akamai",
                namespace: "andromeda",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "network-api",
                },
              },
              instances: [
                { cluster: "qa-de-2" },
                { cluster: "qa-de-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "andromeda-agent-housekeeping",
                namespace: "andromeda",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "network-api",
                },
              },
              instances: [{ cluster: "qa-de-3" }, { cluster: "s-qa-de-1" }],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "andromeda-mariadb",
                namespace: "andromeda",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "network-api",
                },
              },
              instances: [{ cluster: "s-qa-de-1" }],
            },
            {
              pattern: {
                kind: "Job",
                name: "andromeda-migration-20230511182400",
                namespace: "andromeda",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "network-api",
                },
              },
              instances: [{ cluster: "qa-de-3" }, { cluster: "s-qa-de-1" }],
            },
            {
              pattern: {
                kind: "CronJob",
                name: "cc3test-blockstorage",
                namespace: "cc3test",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "CronJob",
                name: "cc3test-blockstorage-purger",
                namespace: "cc3test",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "CronJob",
                name: "cc3test-blockstorage-volume",
                namespace: "cc3test",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "observability",
                },
              },
              instances: [
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "bind3-cluster-4",
                namespace: "dns-hybrid",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "bind",
                  support_group: "network-api",
                },
              },
              instances: [{ cluster: "cluster-15" }],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "bind3-cluster-5",
                namespace: "dns-hybrid",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "bind",
                  support_group: "network-api",
                },
              },
              instances: [{ cluster: "cluster-15" }],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "bind3-cluster-7",
                namespace: "dns-hybrid",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "bind",
                  support_group: "network-api",
                },
              },
              instances: [{ cluster: "cluster-15" }],
            },
            {
              pattern: {
                kind: "DaemonSet",
                name: "kube-proxy",
                namespace: "kube-system",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: { service: "none", support_group: "none" },
              },
              instances: [
                { cluster: "cluster-8" },
                { cluster: "cluster-9" },
                { cluster: "cluster-10" },
                { cluster: "cluster-11" },
                { cluster: "cluster-12" },
                { cluster: "i-cluster-14" },
                { cluster: "s-cluster-1" },
                { cluster: "s-cluster-2" },
                { cluster: "s-cluster-3" },
                { cluster: "s-cluster-4" },
                { cluster: "s-cluster-5" },
                { cluster: "s-cluster-6" },
                { cluster: "s-cluster-7" },
                { cluster: "s-cluster-13" },
                { cluster: "s-cluster-14" },
                { cluster: "s-cluster-15" },
                { cluster: "s-la-br-1" },
                { cluster: "s-na-ca-1" },
                { cluster: "s-na-us-1" },
                { cluster: "s-na-us-2" },
                { cluster: "s-na-us-3" },
                { cluster: "s-qa-de-1" },
              ],
            },
            {
              pattern: {
                kind: "DaemonSet",
                name: "kube-proxy-ng",
                namespace: "kube-system",
                message:
                  "CPU and memory limits not set on some or all containers",
                object_identity: {
                  service: "none",
                  support_group: "containers",
                },
              },
              instances: [
                { cluster: "cluster-1" },
                { cluster: "cluster-2" },
                { cluster: "cluster-3" },
                { cluster: "cluster-4" },
                { cluster: "cluster-5" },
                { cluster: "cluster-6" },
                { cluster: "cluster-7" },
                { cluster: "cluster-15" },
                { cluster: "la-br-1" },
                { cluster: "na-ca-1" },
                { cluster: "na-us-1" },
                { cluster: "na-us-3" },
                { cluster: "qa-de-6" },
              ],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "ironic-conductor-bb252",
                namespace: "monsoon3",
                message:
                  "CPU and memory requests not set on some or all containers",
                object_identity: {
                  service: "ironic",
                  support_group: "compute-storage-api",
                },
              },
              instances: [{ cluster: "na-us-1" }],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "ironic-conductor-bb253",
                namespace: "monsoon3",
                message:
                  "CPU and memory requests not set on some or all containers",
                object_identity: {
                  service: "ironic",
                  support_group: "compute-storage-api",
                },
              },
              instances: [{ cluster: "na-us-1" }],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "ironic-conductor-bb254",
                namespace: "monsoon3",
                message:
                  "CPU and memory requests not set on some or all containers",
                object_identity: {
                  service: "ironic",
                  support_group: "compute-storage-api",
                },
              },
              instances: [{ cluster: "na-us-1" }],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "ironic-conductor-bb255",
                namespace: "monsoon3",
                message:
                  "CPU and memory requests not set on some or all containers",
                object_identity: {
                  service: "ironic",
                  support_group: "compute-storage-api",
                },
              },
              instances: [{ cluster: "na-us-2" }],
            },
            {
              pattern: {
                kind: "Deployment",
                name: "ironic-conductor-bb256",
                namespace: "monsoon3",
                message:
                  "CPU and memory requests not set on some or all containers",
                object_identity: {
                  service: "ironic",
                  support_group: "compute-storage-api",
                },
              },
              instances: [{ cluster: "na-us-2" }],
            },
            {
              pattern: {
                kind: "Pod",
                name: "thanos-ruler-regional-\u003cindex\u003e",
                namespace: "thanos",
                message:
                  'image keppel.\u003cregion\u003e.cloud.sap/ccloud-quay-mirror/thanos/thanos:v0.28.1 for container "thanos-ruler" has "X-Keppel-Vulnerability-Status: High"',
                object_identity: {
                  service: "prometheus",
                  support_group: "observability",
                },
              },
              instances: [
                {
                  name: "thanos-ruler-regional-0",
                  message:
                    'image keppel.cluster-13.cloud.sap/ccloud-quay-mirror/thanos/thanos:v0.28.1 for container "thanos-ruler" has "X-Keppel-Vulnerability-Status: High"',
                  cluster: "qa-de-6",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
