CHART_DIR       ?= ./charts
HELM_RELEASE    ?= ci-release
HELM_VALUES     ?= $(CHART_DIR)/ci/test-values.yaml
RENDERS         ?= ./build
RENDERED        ?= $(RENDERS)/rendered-template.yaml
EXTERNAL_CONFIG ?= $(RENDERS)/external-config.yaml

# Local collector run settings
CONTAINER_ENGINE ?= podman
OTEL_IMAGE       ?= ghcr.io/cloudoperators/opentelemetry-collector-contrib:main
OTEL_ENV_FILE    ?= scripts/external-collector.env
# Feature gates the chart sets via spec.args (required by flatten_data transforms).
FEATURE_GATES    ?= transform.flatten.logs

# All-pipelines local testing harness (tests/)
TESTS_DIR        ?= ./tests
TEST_VALUES_DIR  ?= $(TESTS_DIR)/values

.PHONY: ci-template extract-external-config lint-external-config run-external-collector clean test-all test-render test-validate

ci-template:
	helm template $(HELM_RELEASE) -f $(HELM_VALUES) $(CHART_DIR)

# Render the chart and extract spec.config from the `external`
# OpenTelemetryCollector into a standalone collector config file.
extract-external-config:
	helm template $(HELM_RELEASE) -f $(HELM_VALUES) $(CHART_DIR) > $(RENDERED)
	python3 scripts/extract_collector_config.py --input $(RENDERED) \
		--kind OpenTelemetryCollector --name external \
		--path spec.config --output $(EXTERNAL_CONFIG)

# Validate the extracted config with the collector itself. The env file is
# required because the config uses ${...} substitutions for credentials.
lint-external-config: extract-external-config
	$(CONTAINER_ENGINE) run --rm \
		--env-file $(OTEL_ENV_FILE) \
		-v "$(abspath $(EXTERNAL_CONFIG))":/etc/otel-config.yaml:ro,Z \
		$(OTEL_IMAGE) validate --config=/etc/otel-config.yaml \
		--feature-gates=$(FEATURE_GATES)

# Run the extracted config in a local OpenTelemetry Collector container.
run-external-collector: lint-external-config
	$(CONTAINER_ENGINE) run --rm \
		-p 1514:514 \
		--env-file $(OTEL_ENV_FILE) \
		-v "$(CURDIR)/$(EXTERNAL_CONFIG)":/etc/otel-config.yaml \
		$(OTEL_IMAGE) \
		--config=/etc/otel-config.yaml \
		--feature-gates=$(FEATURE_GATES)

clean:
	rm -r -f $(RENDERED) $(EXTERNAL_CONFIG) 
	rm -r -f $(TESTS_DIR)/renders

# All-pipelines harness: lint + template + extract every collector config +
# validate each standalone in a container. Iterates over TEST_VALUES_DIR.
test-all:
	CONTAINER_ENGINE=$(CONTAINER_ENGINE) OTEL_IMAGE=$(OTEL_IMAGE) \
		VALUES_DIR=$(TEST_VALUES_DIR) $(TESTS_DIR)/run-tests.sh

# Lint + template + extract only (no container validation).
test-render:
	SKIP_VALIDATE=1 VALUES_DIR=$(TEST_VALUES_DIR) $(TESTS_DIR)/run-tests.sh

# Alias that runs the full harness including container validation.
test-validate: test-all
