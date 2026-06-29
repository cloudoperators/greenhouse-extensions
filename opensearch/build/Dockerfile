# OpenSearch 3.7.0
FROM opensearchproject/opensearch@sha256:123e6591a47b1d54686890551bdb35739c85193ecded381219fc9e059e18128f

LABEL source_repository="https://github.com/cloudoperators/greenhouse-extensions.git"

# Don't change the order!
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-security-analytics \
 && /usr/share/opensearch/bin/opensearch-plugin remove opensearch-alerting \
 && /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/SAP-cloud-infrastructure/opensearch-alerting/releases/download/3.7.0.0-sci-v4/opensearch-alerting-3.7.0.0-sci-v4-SNAPSHOT.zip \
 && /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/SAP-cloud-infrastructure/opensearch-security-analytics/releases/download/3.7.0.0-sci-v2/opensearch-security-analytics-3.7.0.0-sci-v2-SNAPSHOT.zip
