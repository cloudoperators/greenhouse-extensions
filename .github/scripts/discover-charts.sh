#!/bin/bash
# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

# Script to dynamically discover helm charts in the repository
# Excludes charts listed in the blacklist configuration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BLACKLIST_FILE="${SCRIPT_DIR}/../configs/chart-blacklist.yaml"

# Function to check if a path is blacklisted
is_blacklisted() {
    local chart_path="$1"
    
    if [[ ! -f "${BLACKLIST_FILE}" ]]; then
        return 1
    fi
    
    # Read blacklist entries (one per line, ignoring comments and empty lines)
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
        
        # Trim whitespace
        line=$(echo "${line}" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
        
        # Skip if still empty after trimming
        [[ -z "${line}" ]] && continue
        
        # Check if matches
        if [[ "${chart_path}" == "${line}" ]]; then
            return 0
        fi
    done < "${BLACKLIST_FILE}"
    
    return 1
}

# Function to extract chart name from Chart.yaml
get_chart_name() {
    local chart_yaml="$1"
    grep '^name:' "${chart_yaml}" | sed 's/^name:\s*//' | tr -d '"' | tr -d "'" | xargs
}

# Discover all Chart.yaml files, excluding nested charts/charts/ directories
discover_charts() {
    local output_format="${1:-json}"
    
    cd "${REPO_ROOT}"
    
    # Find all Chart.yaml files, excluding nested charts/charts/ subdirectories
    local chart_files
    chart_files=$(find . -name "Chart.yaml" -type f | grep -v "/charts/charts/" | sort)
    
    declare -a chart_entries=()
    
    while IFS= read -r chart_file; do
        # Remove leading ./
        chart_file="${chart_file#./}"
        
        # Get the directory containing Chart.yaml
        local chart_dir
        chart_dir=$(dirname "${chart_file}")
        
        # Check if blacklisted
        if is_blacklisted "${chart_dir}"; then
            echo "Skipping blacklisted chart: ${chart_dir}" >&2
            continue
        fi
        
        # Extract chart name from Chart.yaml
        local chart_name
        chart_name=$(get_chart_name "${chart_file}")
        
        if [[ -z "${chart_name}" ]]; then
            echo "Warning: Could not extract chart name from ${chart_file}" >&2
            continue
        fi
        
        chart_entries+=("{\"chartDir\":\"${chart_dir}\",\"chartName\":\"${chart_name}\"}")
    done <<< "${chart_files}"
    
    if [[ "${output_format}" == "json" ]]; then
        # Output as JSON array for GitHub Actions matrix
        echo -n "["
        local first=true
        for entry in "${chart_entries[@]}"; do
            if [[ "${first}" == "true" ]]; then
                first=false
            else
                echo -n ","
            fi
            echo -n "${entry}"
        done
        echo "]"
    elif [[ "${output_format}" == "paths" ]]; then
        # Output as newline-separated paths for helm-chart-testing.yaml
        for entry in "${chart_entries[@]}"; do
            echo "${entry}" | jq -r '.chartDir'
        done
    fi
}

# Main execution
case "${1:-json}" in
    json)
        discover_charts "json"
        ;;
    paths)
        discover_charts "paths"
        ;;
    *)
        echo "Usage: $0 [json|paths]" >&2
        echo "  json  - Output JSON array for GitHub Actions matrix (default)" >&2
        echo "  paths - Output newline-separated chart directories" >&2
        exit 1
        ;;
esac