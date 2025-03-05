# Detect OS (Linux/macOS)
OS := $(shell uname -s | tr '[:upper:]' '[:lower:]')

# Detect ARCH (AMD64 or ARM64)
UNAME_P := $(shell uname -p)
ARCH :=
ifeq ($(UNAME_P),x86_64)
	ARCH =amd64
endif
ifneq ($(filter arm%,$(UNAME_P)),)
	ARCH = arm64
endif

## tools versions
KUSTOMIZE_VERSION ?= 5.6.0
YQ_VERSION ?= v4.45.1
HELM_DOCS_VERSION ?= 1.14.2

## Location to install dependencies to
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)
KUSTOMIZE ?= $(LOCALBIN)/kustomize
YQ ?= $(LOCALBIN)/yq

KUSTOMIZE_INSTALL_SCRIPT ?= "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"
YQ_INSTALL_SCRIPT ?= https://github.com/mikefarah/yq/releases/latest/download/yq_$(OS)_$(ARCH)
HELM_DOCS_REPO ?= github.com/norwoodj/helm-docs/cmd/helm-docs

## Download `kustomize` locally if necessary
.PHONY: kustomize
kustomize: $(KUSTOMIZE) ## Download kustomize locally if necessary. If wrong version is installed, it will be removed before downloading.
$(KUSTOMIZE): $(LOCALBIN)
	@if test -x $(LOCALBIN)/kustomize && ! $(LOCALBIN)/kustomize version | grep -q $(KUSTOMIZE_VERSION); then \
		echo "$(LOCALBIN)/kustomize version is not expected $(KUSTOMIZE_VERSION). Removing it before installing."; \
		rm -rf $(LOCALBIN)/kustomize; \
	fi
	test -s $(LOCALBIN)/kustomize || curl -s $(KUSTOMIZE_INSTALL_SCRIPT) | bash -s -- $(subst v,,$(KUSTOMIZE_VERSION)) $(LOCALBIN)

## Download `yq` locally if necessary
.PHONY: yq
yq: $(YQ)
$(YQ): $(LOCALBIN)
	@if test -x $(LOCALBIN)/yq && ! $(LOCALBIN)/yq --version | grep -q $(YQ_VERSION); then \
		echo "$(LOCALBIN)/yq version is not expected $(YQ_VERSION). Removing it before installing."; \
		rm -rf $(LOCALBIN)/yq; \
	fi
	test -s $(LOCALBIN)/yq || curl -L $(YQ_INSTALL_SCRIPT) -o $(LOCALBIN)/yq && chmod +x $(LOCALBIN)/yq

## Download `helm-docs` locally if necessary
.PHONY: helm-docs
helm-docs:
	@if test -x $(LOCALBIN)/helm-docs; then \
		echo "$(LOCALBIN)/helm-docs is not expected. Removing it before installing."; \
		rm -rf $(LOCALBIN)/helm-docs; \
	fi;
	GOBIN=$(LOCALBIN) go install $(HELM_DOCS_REPO)@v$(HELM_DOCS_VERSION);

.PHONY: generate-documentation
generate-documentation:
	hack/generate-catalog-markdown

.PHONY: local-plugin-definitions
local-plugin-definitions: kustomize yq
	hack/local-plugin-definitions

.PHONY: generate-readme
generate-readme: helm-docs
	@PLUGIN=$(PLUGIN); \
	if [ -d "./$$PLUGIN" ] && [ "$$PLUGIN" != "" ]; then\
		echo "Generating README for $$PLUGIN..."; \
		cd ./$$PLUGIN; ../bin/helm-docs -o ../README.md -t ./README.md.gotmpl; \
		echo "README generation complete!"; \
	else \
		echo "Error: Plugin directory '$$PLUGIN' does not exist"; \
		echo "Available plugins:"; \
		ls -d */ | sed 's#/##' | sed 's/LICENSES//' || echo "No plugin directories found"; \
		exit 1; \
	fi