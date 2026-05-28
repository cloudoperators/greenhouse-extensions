#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
#
# Verify every top-level Helm chart (non-subchart) is registered in
# .github/configs/plugins.yaml. Used by the Plugins Consistency workflow.
#
# Usage:
#   .github/scripts/check-plugins-coverage.sh [path/to/plugins.yaml]

set -euo pipefail

PLUGINS_YAML="${1:-.github/configs/plugins.yaml}"

if [[ ! -f "$PLUGINS_YAML" ]]; then
  echo "Plugins file not found: $PLUGINS_YAML" >&2
  exit 1
fi

# Read declared chartDir values into an associative set.
declare -A declared
while IFS= read -r d; do
  [[ -z "$d" ]] && continue
  declared["$d"]=1
done < <(yq -r '.plugins[].chartDir' "$PLUGINS_YAML")

missing=0
extra=0
seen=""

# Discover Chart.yaml files, skipping vendored dependencies, .git, and the
# render-ct-config helm dependency cache (if any).
while IFS= read -r chart_yaml; do
  dir="${chart_yaml%/Chart.yaml}"
  dir="${dir#./}"

  # Subchart heuristic: walk up from $dir; if any ancestor (still inside the
  # repo) has its own Chart.yaml, the current chart is a subchart of it.
  parent="$(dirname "$dir")"
  is_subchart=0
  while [[ "$parent" != "." && "$parent" != "/" ]]; do
    if [[ -f "$parent/Chart.yaml" ]]; then
      is_subchart=1
      break
    fi
    parent="$(dirname "$parent")"
  done
  if [[ $is_subchart -eq 1 ]]; then
    continue
  fi

  seen+=$'\n'"$dir"

  if [[ -z "${declared[$dir]:-}" ]]; then
    echo "ERROR: Chart at '$dir' is not registered in $PLUGINS_YAML"
    missing=1
  fi
done < <(find . -type f -name Chart.yaml \
            -not -path './.git/*' \
            -not -path '*/node_modules/*' \
            | sort)

# Check for entries in plugins.yaml that point to non-existent dirs.
for d in "${!declared[@]}"; do
  if [[ ! -f "$d/Chart.yaml" ]]; then
    echo "ERROR: $PLUGINS_YAML lists '$d' but '$d/Chart.yaml' does not exist"
    extra=1
  fi
done

if [[ $missing -eq 1 ]]; then
  echo
  echo "Add the missing chart(s) under 'plugins:' in $PLUGINS_YAML, then run:"
  echo "  .github/scripts/render-ct-config.sh > .github/configs/helm-chart-testing.yaml"
fi

if [[ $extra -eq 1 ]]; then
  echo
  echo "Remove the stale entry from $PLUGINS_YAML, then run:"
  echo "  .github/scripts/render-ct-config.sh > .github/configs/helm-chart-testing.yaml"
fi

if [[ $missing -eq 1 || $extra -eq 1 ]]; then
  exit 1
fi

echo "OK: all charts in this repo are registered in $PLUGINS_YAML"
