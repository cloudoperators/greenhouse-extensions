FROM opensearchproject/opensearch:3.6.0

LABEL source_repository="https://github.com/cloudoperators/greenhouse-extensions.git"

USER root

# Don't change the order!
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-security-analytics
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-alerting

# Don't change the order!
# Will change the plugins repository to one of SAP repos ASAP.
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/thecodingshrimp/opensearch-plugins-alerting/releases/download/v2-custom/opensearch-alerting-3.6.0.0-v2-SNAPSHOT.zip
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/thecodingshrimp/opensearch-plugin-security-analytics/releases/download/v2-custom/opensearch-security-analytics-3.6.0.0-v2-SNAPSHOT.zip

USER opensearch
