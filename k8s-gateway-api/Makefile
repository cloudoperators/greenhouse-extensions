# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

SHELL = /usr/bin/env bash -o pipefail
.SHELLFLAGS = -ec

CRDS_DIR := charts/crds

.PHONY: crds
crds: ## Render Gateway API CRDs from kustomization and split into individual files in charts/crds/.
	mkdir -p $(CRDS_DIR)
	rm -f $(CRDS_DIR)/*.yaml
	kustomize build . | \
		yq e 'select(.) | {"apiVersion": .apiVersion, "kind": .kind, "metadata": .metadata, "spec": .spec}' - | \
		yq e -s '"$(CRDS_DIR)/" + .metadata.name + ".yaml"' -
