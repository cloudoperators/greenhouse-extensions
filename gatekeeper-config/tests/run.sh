#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

# Usage: ./run.sh [extra gator args]
set -euo pipefail

cd "$(dirname "$0")"

rm -rf rendered
helm template ../charts -f values-test.yaml --output-dir rendered >/dev/null

gator verify -v . "$@"
