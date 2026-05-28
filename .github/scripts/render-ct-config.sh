#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
#
# Render .github/configs/helm-chart-testing.yaml from .github/configs/plugins.yaml.
# Usage:
#   .github/scripts/render-ct-config.sh > .github/configs/helm-chart-testing.yaml
#
# Used by:
#   - Developers regenerating the file after editing plugins.yaml
#   - The Plugins Consistency workflow to assert the checked-in file is current

set -euo pipefail

PLUGINS_YAML="${1:-.github/configs/plugins.yaml}"

if [[ ! -f "$PLUGINS_YAML" ]]; then
  echo "Plugins file not found: $PLUGINS_YAML" >&2
  exit 1
fi

cat <<'HEADER'
# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

# See https://github.com/helm/chart-testing#configuration
#
# This file is generated from .github/configs/plugins.yaml.
# Do not edit by hand. Run:
#   .github/scripts/render-ct-config.sh > .github/configs/helm-chart-testing.yaml
remote: origin
target-branch: main
validate-maintainers: true
check-version-increment: true
skip-clean-up: true
namespace: default
release-label: "app.kubernetes.io/instance"
HEADER

echo "chart-dirs:"
yq -r '[.plugins[].ctChartDir] | unique | .[]' "$PLUGINS_YAML" | sed 's/^/  - /'

echo "chart-repos:"
yq -r '[.plugins[].chartRepos // [] | .[]] | unique | .[]' "$PLUGINS_YAML" | sed 's/^/  - /'
