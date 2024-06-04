#!/usr/bin/env bash

set -o errexit
set -o pipefail

KIND_CLUSTER_VERSION="kindest/node:v1.29.2"
KUBECONFIG_DIR="./envtest"


function prepare_cluster(){
  rm -f ${REMOTE_CLUSTER_KUBECONFIG}
	kind delete cluster --name "${REMOTE_CLUSTER_NAME}"
	kind create cluster --name "${REMOTE_CLUSTER_NAME}" --kubeconfig="${REMOTE_CLUSTER_KUBECONFIG}" --image ${KIND_CLUSTER_VERSION}

  KIND_SERVER="https://${REMOTE_CLUSTER_NAME}-control-plane:6443"
	kubectl --kubeconfig="${REMOTE_CLUSTER_KUBECONFIG}" config set-cluster "kind-${REMOTE_CLUSTER_NAME}" --server="${KIND_SERVER}"

  echo "connecting ${REMOTE_CLUSTER_NAME} to dev-env_default network"
  docker network connect "dev-env_default" "${REMOTE_CLUSTER_NAME}-control-plane"
}

function onboard_cluster(){
  echo "Creating secret on dev-env cluster to onboard ${REMOTE_CLUSTER_NAME}"
  cat <<EOF | kubectl --kubeconfig ./envtest/kubeconfig apply -f - 
  apiVersion: v1 
  kind: Secret 
  metadata: 
    name: ${REMOTE_CLUSTER_NAME} 
    namespace: test-org 
  data: 
    kubeconfig: $(cat ${REMOTE_CLUSTER_KUBECONFIG} | base64)
  type: "greenhouse.sap/kubeconfig" 
EOF
}

REMOTE_CLUSTER_NAME=$1
if [[ -z "${REMOTE_CLUSTER_NAME}" ]]; then
  REMOTE_CLUSTER_NAME="remote-cluster"
fi
REMOTE_CLUSTER_KUBECONFIG="${KUBECONFIG_DIR}/${REMOTE_CLUSTER_NAME}.kubeconfig"

prepare_cluster
onboard_cluster
