# Detect OS (Linux/macOS)
OS := $(shell uname -s | tr '[:upper:]' '[:lower:]')

# Detect ARCH (AMD64 or ARM64)
UNAME_M := $(shell uname -m)
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
YQ_VERSION ?= v4.45.4
HELM_DOCS_VERSION ?= 1.14.2
PINT_VERSION ?= 0.73.7
HELM_VERSION ?= 3.17.3

## Location to install dependencies to
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)
KUSTOMIZE ?= $(LOCALBIN)/kustomize
YQ ?= $(LOCALBIN)/yq
PINT ?= $(LOCALBIN)/pint
HELM ?= $(LOCALBIN)/helm
HELM-DOCS ?= $(LOCALBIN)/helm-docs

KUSTOMIZE_INSTALL_SCRIPT ?= "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"
YQ_INSTALL_SCRIPT ?= https://github.com/mikefarah/yq/releases/latest/download/yq_$(OS)_$(ARCH)
HELM_DOCS_REPO ?= https://github.com/norwoodj/helm-docs/releases/download/v$(HELM_DOCS_VERSION)/helm-docs_$(HELM_DOCS_VERSION)_$(OS)_$(UNAME_M).tar.gz
PINT_REPO ?= https://github.com/cloudflare/pint/releases/download/v$(PINT_VERSION)/pint-$(PINT_VERSION)-$(OS)-$(ARCH).tar.gz
HELM_URL ?= https://get.helm.sh/helm-v$(HELM_VERSION)-$(OS)-$(ARCH).tar.gz

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
helm-docs: $(HELM-DOCS)
$(HELM-DOCS): $(LOCALBIN)
	@if test -x $(LOCALBIN)/helm-docs && ! $(LOCALBIN)/helm-docs -v | grep -q $(HELM_DOCS_VERSION); then \
		echo "$(LOCALBIN)/helm-docs -v is not expected $(HELM_DOCS_VERSION). Removing it before installing."; \
		rm -rf $(LOCALBIN)/helm-docs; \
	fi;
	if ! test -s $(LOCALBIN)/helm-docs; then \
		curl -L $(HELM_DOCS_REPO) -o $(LOCALBIN)/helm-docs.tar.gz \
		&& tar -xzf $(LOCALBIN)/helm-docs.tar.gz -C $(LOCALBIN) helm-docs \
		&& rm $(LOCALBIN)/helm-docs.tar.gz \
		&& chmod +x $(LOCALBIN)/helm-docs; \
	fi;

## Download `pint` locally if necessary
.PHONY: pint-install
pint-install: $(PINT)
$(PINT): $(LOCALBIN)
	@if test -x $(LOCALBIN)/pint && ! $(LOCALBIN)/pint version | grep -q $(PINT_VERSION); then \
		echo "$(LOCALBIN)/pint version is not expected $(PINT_VERSION). Removing it before installing."; \
		rm -rf $(LOCALBIN)/pint; \
	fi;
	if ! test -x $(LOCALBIN)/pint; then \
		curl -L $(PINT_REPO) -o $(LOCALBIN)/pint.tar.gz \
		&& tar -xzf $(LOCALBIN)/pint.tar.gz -C $(LOCALBIN) pint-$(OS)-$(ARCH) \
		&& rm $(LOCALBIN)/pint.tar.gz \
		&& mv $(LOCALBIN)/pint-$(OS)-$(ARCH)  $(LOCALBIN)/pint \
		&& chmod +x $(LOCALBIN)/pint; \
	fi;

## Download `helm` locally if necessary
.PHONY: helm-install
helm-install: $(HELM)
$(HELM): $(LOCALBIN)
	@if test -x $(LOCALBIN)/helm && ! $(LOCALBIN)/helm version | grep -q $(HELM_VERSION); then \
		echo "$(LOCALBIN)/helm is not expected. Removing it before installing."; \
		rm -rf $(LOCALBIN)/helm; \
	fi;
	if ! test -x $(LOCALBIN)/helm; then \
		curl -fsSL $(HELM_URL) -o $(LOCALBIN)/helm.tar.gz \
		&& tar -zxvf $(LOCALBIN)/helm.tar.gz -C $(LOCALBIN) \
		&& rm $(LOCALBIN)/helm.tar.gz \
		&& mv $(LOCALBIN)/$(OS)-$(ARCH)/helm  $(LOCALBIN)/helm \
		&& chmod +x $(LOCALBIN)/helm \
		&& rm -rf $(LOCALBIN)/$(OS)-$(ARCH); \
	fi;


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

.PHONY: pint
pint: pint-install helm-install yq
	@PLUGIN=$(PLUGIN); \
	if [ -d "./$$PLUGIN" ] && [ "$$PLUGIN" != "" ]; then\
		echo "Running pint for $$PLUGIN..."; \
		cd ./$$PLUGIN/charts; $(LOCALBIN)/helm template . --values ci/test-values.yaml | yq > $(LOCALBIN)/template.yaml \
		&& $(LOCALBIN)/pint -c ../../pint-config.hcl lint $(LOCALBIN)/template.yaml; \
		rm $(LOCALBIN)/template.yaml \
		&& echo "pint analysis complete!"; \
	else \
		echo "Error: Plugin directory '$$PLUGIN' does not exist"; \
		echo "Available plugins:"; \
		ls -d */ | sed 's#/##' | sed 's/LICENSES//' || echo "No plugin directories found"; \
		exit 1; \
	fi;