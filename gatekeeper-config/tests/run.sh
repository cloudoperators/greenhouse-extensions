#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

# Usage: ./run.sh [extra gator args]
set -euo pipefail

cd "$(dirname "$0")"

FAST_SHUTDOWN=1 helm-manifest-parser 127.0.0.1:8080 &
parser_pid=$!
trap 'kill "$parser_pid"' EXIT

rm -rf rendered
helm template ../charts -f values-test.yaml --output-dir rendered >/dev/null

for f in fixtures/*/*.in.yaml; do
  helm-manifest-generator < "$f" > "${f%.in.yaml}.out.yaml"
done

gator verify -v . "$@"
