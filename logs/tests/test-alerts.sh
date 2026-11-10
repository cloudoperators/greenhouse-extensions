#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
#
# Renders the chart's PrometheusRule for namespace "logs" with every rule enabled and runs the promtool unit tests in
# alerts-test.yaml against it.
#
# usage: logs/tests/test-alerts.sh
# needs helm, python3 with PyYAML, and promtool or docker (PROMETHEUS_IMAGE, default prom/prometheus:v3.11.2)
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
chart="$here/../charts"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

helm template logs "$chart" -n logs --api-versions monitoring.coreos.com/v1 \
  -f "$chart/ci/test-values.yaml" -f "$here/values-test-alerts.yaml" > "$work/render.yaml"

python3 - "$work/render.yaml" "$work/rules.yaml" <<'PY'
import sys, yaml
rules = [d for d in yaml.safe_load_all(open(sys.argv[1])) if d and d.get("kind") == "PrometheusRule"]
if len(rules) != 1:
    sys.exit(f"expected 1 PrometheusRule, rendered {len(rules)}")
yaml.safe_dump(rules[0]["spec"], open(sys.argv[2], "w"), sort_keys=False, width=10000)
PY
cp "$here/alerts-test.yaml" "$work/"

if command -v promtool >/dev/null 2>&1; then
  (cd "$work" && promtool check rules rules.yaml && promtool test rules alerts-test.yaml)
else
  image=${PROMETHEUS_IMAGE:-prom/prometheus:v3.11.2}
  docker run --rm --user "$(id -u):$(id -g)" -v "$work:/work" -w /work --entrypoint /bin/sh "$image" \
    -c 'promtool check rules rules.yaml && promtool test rules alerts-test.yaml'
fi
