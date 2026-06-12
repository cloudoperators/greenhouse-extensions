# OpenSearch 3.6.0
FROM opensearchproject/opensearch@sha256:57bd3c879ad27123a9a6cd75e2adba504189d3131d00a669f3baf9210bc4538c

LABEL source_repository="https://github.com/cloudoperators/greenhouse-extensions.git"

# Don't change the order!
# Plugins sourced from SAP-cloud-infrastructure org releases.
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-security-analytics \
 && /usr/share/opensearch/bin/opensearch-plugin remove opensearch-alerting \
 && /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/SAP-cloud-infrastructure/opensearch-alerting/releases/download/3.6.0.0-sci-v2/opensearch-alerting-3.6.0.0-sci-v2-SNAPSHOT.zip \
 && /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/SAP-cloud-infrastructure/opensearch-security-analytics/releases/download/3.6.0.0-sci-v2/opensearch-security-analytics-3.6.0.0-sci-v2-SNAPSHOT.zip

