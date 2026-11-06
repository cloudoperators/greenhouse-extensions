#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
#
# Local testing harness for the logs chart's OpenTelemetry collectors.
#
# For each values file in tests/values/, this:
#   1. helm lint            (static)
#   2. helm template        (render)
#   3. extract every OpenTelemetryCollector spec.config  (tests/renders/<file>/)
#   4. otel `validate` each extracted config in a container
#
# No Kubernetes cluster is required. `validate` checks config validity only
# (not connectivity), so the dummy Kafka/OpenSearch endpoints are fine.
#
# Usage:
#   tests/run-tests.sh                       # all values files
#   tests/run-tests.sh openstack             # only files matching *openstack*
#   CONTAINER_ENGINE=docker tests/run-tests.sh
#   SKIP_VALIDATE=1 tests/run-tests.sh       # lint + render + extract only
#   FEATURE_GATES=transform.flatten.logs tests/run-tests.sh
#                                            # override the collector feature gates

set -euo pipefail

# Resolve paths relative to this script so it works from any CWD.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(cd "${SCRIPT_DIR}/../charts" && pwd)"
VALUES_DIR="${VALUES_DIR:-${SCRIPT_DIR}/values}"
ENV_FILE="${ENV_FILE:-${SCRIPT_DIR}/env/collector.env}"
RENDERS_DIR="${RENDERS_DIR:-${SCRIPT_DIR}/renders}"
EXTRACT="${SCRIPT_DIR}/../scripts/extract_collector_config.py"

HELM_RELEASE="${HELM_RELEASE:-logs}"
CONTAINER_ENGINE="${CONTAINER_ENGINE:-podman}"
OTEL_IMAGE="${OTEL_IMAGE:-ghcr.io/cloudoperators/opentelemetry-collector-contrib:main}"
SKIP_VALIDATE="${SKIP_VALIDATE:-0}"
# The chart sets spec.args.feature-gates on the logs/external collectors, which
# the operator turns into --feature-gates for the running collector. Standalone
# runs must pass it explicitly, or transforms using flatten_data fail.
FEATURE_GATES="${FEATURE_GATES:-transform.flatten.logs}"

FILTER="${1:-}"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

fail_count=0
pass_count=0

command -v helm >/dev/null 2>&1 || { red "helm not found in PATH"; exit 127; }

mkdir -p "${RENDERS_DIR}"

# The OpenTelemetry Collector's `validate` builds the pipelines, which makes
# TLS-enabled receivers (syslog TLS, HTTP TLS) eagerly load their cert/key/CA
# files from disk. Provide dummy material and mount it at the paths the chart
# references so validation of the full external collector succeeds standalone.
CERTS_DIR="${RENDERS_DIR}/certs"
ensure_certs() {
  if [[ -f "${CERTS_DIR}/tls.crt" && -f "${CERTS_DIR}/tls.key" && -f "${CERTS_DIR}/ca.crt" ]]; then
    return
  fi
  command -v openssl >/dev/null 2>&1 || { red "openssl not found; needed to generate dummy TLS certs"; exit 127; }
  mkdir -p "${CERTS_DIR}"
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "${CERTS_DIR}/tls.key" -out "${CERTS_DIR}/tls.crt" \
    -days 365 -subj "/CN=logs-collector-syslog.test.cloud.sap" >/dev/null 2>&1
  cp "${CERTS_DIR}/tls.crt" "${CERTS_DIR}/ca.crt"
}

# TLS dirs referenced by the rendered collector configs. A single dir holding
# tls.crt/tls.key/ca.crt is mounted at each (kafka/opensearch only need ca.crt).
tls_mounts() {
  local d
  for d in /etc/ssl/syslog-tls /etc/ssl/kafka /etc/ssl/audit-kafka /etc/ssl/opensearch; do
    printf ' -v %s:%s:ro,Z' "${CERTS_DIR}" "${d}"
  done
}

ensure_certs


shopt -s nullglob
values_files=("${VALUES_DIR}"/*.yaml "${VALUES_DIR}"/*.yml)
shopt -u nullglob

if [[ ${#values_files[@]} -eq 0 ]]; then
  red "No values files found in ${VALUES_DIR}"
  exit 1
fi

for values in "${values_files[@]}"; do
  name="$(basename "${values%.*}")"
  if [[ -n "${FILTER}" && "${name}" != *"${FILTER}"* ]]; then
    continue
  fi

  bold "==> ${name}"

  # 1. lint
  if helm lint "${CHART_DIR}" -f "${values}" >/dev/null 2>"${RENDERS_DIR}/${name}.lint.log"; then
    green "    lint: ok"
  else
    red "    lint: FAILED (see ${RENDERS_DIR}/${name}.lint.log)"
    cat "${RENDERS_DIR}/${name}.lint.log"
    fail_count=$((fail_count + 1))
    continue
  fi

  # 2. render
  render="${RENDERS_DIR}/${name}.yaml"
  if helm template "${HELM_RELEASE}" "${CHART_DIR}" -f "${values}" >"${render}" 2>"${RENDERS_DIR}/${name}.template.log"; then
    green "    template: ok -> ${render}"
  else
    red "    template: FAILED"
    cat "${RENDERS_DIR}/${name}.template.log"
    fail_count=$((fail_count + 1))
    continue
  fi

  # 3. extract every collector config
  outdir="${RENDERS_DIR}/${name}"
  rm -rf "${outdir}"
  if ! python3 "${EXTRACT}" --input "${render}" --kind OpenTelemetryCollector \
        --path spec.config --all "${outdir}" 2>"${RENDERS_DIR}/${name}.extract.log"; then
    red "    extract: FAILED"
    cat "${RENDERS_DIR}/${name}.extract.log"
    fail_count=$((fail_count + 1))
    continue
  fi
  collectors=("${outdir}"/*.yaml)
  green "    extract: ok (${#collectors[@]} collector(s))"

  # 4. validate each collector config standalone
  if [[ "${SKIP_VALIDATE}" == "1" ]]; then
    printf '    validate: skipped (SKIP_VALIDATE=1)\n'
    pass_count=$((pass_count + 1))
    continue
  fi

  if ! command -v "${CONTAINER_ENGINE}" >/dev/null 2>&1; then
    red "    validate: ${CONTAINER_ENGINE} not found; set CONTAINER_ENGINE or SKIP_VALIDATE=1"
    fail_count=$((fail_count + 1))
    continue
  fi

  file_failed=0
  for cfg in "${collectors[@]}"; do
    cname="$(basename "${cfg%.yaml}")"
    # shellcheck disable=SC2046
    if "${CONTAINER_ENGINE}" run --rm \
        --env-file "${ENV_FILE}" \
        $(tls_mounts) \
        -v "${cfg}":/etc/otel-config.yaml:ro,Z \
        "${OTEL_IMAGE}" validate --config=/etc/otel-config.yaml \
        ${FEATURE_GATES:+--feature-gates=${FEATURE_GATES}} \
        >"${RENDERS_DIR}/${name}.${cname}.validate.log" 2>&1; then
      green "    validate: ok   ${cname}"
    else
      red "    validate: FAIL ${cname} (see ${RENDERS_DIR}/${name}.${cname}.validate.log)"
      cat "${RENDERS_DIR}/${name}.${cname}.validate.log"
      file_failed=1
    fi
  done

  if [[ ${file_failed} -eq 0 ]]; then
    pass_count=$((pass_count + 1))
  else
    fail_count=$((fail_count + 1))
  fi
done

echo
bold "Summary: ${pass_count} passed, ${fail_count} failed"
[[ ${fail_count} -eq 0 ]]
