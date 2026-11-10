#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

# Unit tests for the logs plugin alert rules.
# Usage: ./run.sh   (needs helm and promtool; set PROMTOOL to use another promtool command)
set -euo pipefail

cd "$(dirname "$0")"
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

helm template logs ../../charts -n logs -f ../../charts/ci/test-values.yaml \
  --api-versions monitoring.coreos.com/v1 --show-only templates/alerts.yaml \
  | awk 'f { sub(/^  /, ""); print } /^spec:/ { f = 1 }' > "$out/rules.yaml"
cp ./*.test.yaml "$out/"

# Render gating. Renders go into variables first: `helm ... | grep -q` under pipefail
# fails the pipeline when grep exits early, which would hide a match.
render() {
  helm template logs ../../charts -n logs -f ../../charts/ci/test-values.yaml \
    --api-versions monitoring.coreos.com/v1 --show-only "templates/$1" "${@:2}"
}
has() { grep -Eq "$2" <<<"$1"; }
udp_rules='alert: OTelUDP(ReceiveDrops|ReceiveDropRatioHigh|StatsExporterDown)$'
refused_rule='alert: OTelExternalReceiverRefusedLogs$'
fail() { echo "FAIL: $*"; exit 1; }

# The UDP rules need the udp-stats sidecar, syslog and the PodMonitor.
for off in openTelemetry.externalCollector.udpStatsExporter.enabled \
           openTelemetry.externalCollector.syslogConfig.enabled \
           openTelemetry.prometheus.podMonitor.enabled; do
  r=$(render alerts.yaml --set "$off=false")
  has "$r" "$udp_rules" && fail "UDP rules rendered with $off=false"
done
# The refusal rule needs syslog and the PodMonitor, not the sidecar.
r=$(render alerts.yaml --set openTelemetry.externalCollector.udpStatsExporter.enabled=false)
has "$r" "$refused_rule" || fail "OTelExternalReceiverRefusedLogs missing without the sidecar"
for off in openTelemetry.externalCollector.syslogConfig.enabled openTelemetry.prometheus.podMonitor.enabled; do
  r=$(render alerts.yaml --set "$off=false")
  has "$r" "$refused_rule" && fail "OTelExternalReceiverRefusedLogs rendered with $off=false"
done
# The sidecar itself is only rendered when the PodMonitor scrapes it.
r=$(render external-collector.yaml)
has "$r" 'name: udp-stats$' || fail "udp-stats sidecar missing with all features on"
r=$(render external-collector.yaml --set openTelemetry.prometheus.podMonitor.enabled=false)
has "$r" 'name: udp-stats$' && fail "udp-stats sidecar rendered without the PodMonitor"
echo "render gating: OK"

cd "$out"
${PROMTOOL:-promtool} check rules rules.yaml
${PROMTOOL:-promtool} test rules ./*.test.yaml
