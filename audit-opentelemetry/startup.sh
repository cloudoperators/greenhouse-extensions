#!/bin/sh
# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0


load_gen=load-gen
load_recv=load-recv
otel=otel-collector


component=$(gum choose --no-limit --header "Select component to start" {$otel,$load_gen,$load_recv})

kubectl create namespace app
kubectl create secret generic otel-basic-auth --namespace app --from-literal=username=admin --from-literal=password=admin

echo $component
if echo $component | grep -w -q $load_gen; then
  echo "Deploying load gen"
  docker buildx build --platform=linux/amd64 -t load-gen:1.0 ci/send/ &&
  kind load docker-image load-gen:1.0 &&
  kubectl delete -f ci/send/dep.yaml
  kubectl apply -f ci/send/dep.yaml
  echo "Done with load gen"
fi
if echo $component | grep -w -q $load_recv; then
  echo "Deploying load recv"
  docker buildx build --platform=linux/amd64 -t load-recv:1.0 ci/recv/ &&
  kind load docker-image load-recv:1.0 &&
  kubectl delete -f ci/recv/dep.yaml
  kubectl apply -f ci/recv/dep.yaml
  echo "Done with load recv"
fi

if echo $component | grep -w -q $otel; then
  helm upgrade --install opentelemetry-operator-audit ./chart --namespace app
fi

gum style \
	--foreground "#09E85E" --border-foreground "#09E85E" --border double \
	--align center --width 50 --margin "1 2" --padding "2 4" \
	'All done'