# OpenSearch 3.6.0
FROM opensearchproject/opensearch@sha256:57bd3c879ad27123a9a6cd75e2adba504189d3131d00a669f3baf9210bc4538c

LABEL source_repository="https://github.com/cloudoperators/greenhouse-extensions.git"

# Don't change the order!
# Will change the plugins repository to one of SAP repos ASAP.
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-security-analytics \
 && /usr/share/opensearch/bin/opensearch-plugin remove opensearch-alerting \
 && /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/thecodingshrimp/opensearch-plugins-alerting/releases/download/v2-custom/opensearch-alerting-3.6.0.0-v2-SNAPSHOT.zip \
 && /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/thecodingshrimp/opensearch-plugin-security-analytics/releases/download/v2-custom/opensearch-security-analytics-3.6.0.0-v2-SNAPSHOT.zip

