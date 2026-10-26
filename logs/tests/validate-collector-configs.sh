#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
#
# Renders the logs chart and runs `otelcol validate` on every OpenTelemetryCollector config, with the image and args
# (feature gates) the chart sets. Fails when the pinned collector image does not accept a rendered config (for example
# a contrib bump that drops a feature gate the config needs), or when the rendered collectors are not exactly the
# expected ones, so a values change can not silently shrink what is checked.
#
# usage: logs/tests/validate-collector-configs.sh "<expected collector names>" [helm template args...]
#   e.g. logs/tests/validate-collector-configs.sh "external logs metrics" -f logs/tests/values-test.yaml
# needs helm, docker, python3 with PyYAML, openssl
set -euo pipefail

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "usage: $0 \"<expected collector names>\" [helm template args...]" >&2
  exit 2
fi
expected=$1
shift

here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
helm_args="$*"
stage="helm template"
summary=""

# Runs on every exit (including set -e aborts), so the step summary is written even when helm template or the
# collector set check fails before any collector is validated.
# shellcheck disable=SC2329 # invoked by the EXIT trap
finish() {
  local status=$?
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      echo "## otelcol validate: $helm_args"
      echo ""
      echo "| collector | result |"
      echo "|---|---|"
      printf '%s' "$summary"
      if [ "$status" -ne 0 ] && [ "$stage" != "validate" ]; then
        echo "| (all) | FAIL at $stage: $(tail -1 "$work/stage.log" 2>/dev/null | cut -c1-150 | tr '|' '/') |"
      fi
    } >> "$GITHUB_STEP_SUMMARY"
  fi
  rm -rf "$work"
  exit "$status"
}
trap finish EXIT

if ! helm template logs "$here/../charts" -n logs "$@" > "$work/render.yaml" 2> "$work/stage.log"; then
  cat "$work/stage.log" >&2
  exit 1
fi
stage="dummy certs"

# Dummy certs for every TLS file the configs reference, so receivers and exporters can be built.
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=validate \
  -keyout "$work/dummy.key" -out "$work/dummy.crt" > "$work/stage.log" 2>&1
stage="collector set"

python3 -u - "$work" "$expected" <<'PY' 2>&1 | tee "$work/stage.log"
import os, re, shutil, sys, yaml
work, expected = sys.argv[1], set(sys.argv[2].split())

def tls_files(node):
    # Every cert_file/key_file/ca_file value in the parsed config, wherever it is nested.
    if isinstance(node, dict):
        for k, v in node.items():
            if k in ('cert_file', 'key_file', 'ca_file') and isinstance(v, str):
                yield k, v
            else:
                yield from tls_files(v)
    elif isinstance(node, list):
        for v in node:
            yield from tls_files(v)

names = set()
for d in yaml.safe_load_all(open(f'{work}/render.yaml')):
    if not d or d.get('kind') != 'OpenTelemetryCollector':
        continue
    name, spec = d['metadata']['name'], d['spec']
    names.add(name)
    cfg = spec['config'] if isinstance(spec['config'], str) else yaml.safe_dump(spec['config'], sort_keys=False, width=100000)
    cfg = re.sub(r'\$\{(env:)?[A-Za-z_][A-Za-z0-9_]*\}', 'placeholder', cfg)
    os.makedirs(f'{work}/{name}/cfg')
    open(f'{work}/{name}/cfg/config.yaml', 'w').write(cfg)
    mounts = set()
    for field, path in sorted(set(tls_files(yaml.safe_load(cfg)))):
        if not path.startswith('/') or '..' in path.split('/'):
            sys.exit(f'FAIL {name}: {field} must be an absolute path without "..": {path}')
        src = f'{work}/{name}/files{path}'
        os.makedirs(os.path.dirname(src), exist_ok=True)
        shutil.copy(f'{work}/dummy.key' if field == 'key_file' else f'{work}/dummy.crt', src)
        os.chmod(src, 0o644)  # the collector image runs as a non-root user
        mounts.add(os.path.dirname(path))
    args = ' '.join(f'--{k}={v}' for k, v in (spec.get('args') or {}).items())
    vols = ' '.join(f'-v {work}/{name}/files{m}:{m}:ro' for m in sorted(mounts))
    open(f'{work}/{name}/run', 'w').write(f"{spec['image']}\n{args}\n{vols}\n")
print(f'{len(names)} collector configs rendered: {" ".join(sorted(names)) or "none"}')
if names != expected:
    print(f'FAIL rendered collectors differ from expected: missing {sorted(expected - names)}, unexpected {sorted(names - expected)}')
    sys.exit(1)
PY

stage="validate"
rc=0
for dir in "$work"/*/; do
  [ -f "$dir/run" ] || continue
  name=$(basename "$dir")
  { read -r image; read -r args; read -r vols; } < "$dir/run"
  # KUBE_NODE_NAME: k8s_attributes (node_from_env_var) reads it from the environment, not from the config.
  # shellcheck disable=SC2086
  if out=$(docker run --rm -e KUBE_NODE_NAME=validate $vols -v "$dir/cfg:/cfg:ro" "$image" validate --config=/cfg/config.yaml $args 2>&1); then
    echo "ok   $name ($image $args)"
    summary+="| $name | ok |"$'\n'
  else
    echo "FAIL $name ($image $args)"
    reason=$(echo "$out" | grep -iE 'error|panic' | head -3 | cut -c1-300 || true)
    [ -n "$reason" ] || reason=$(echo "$out" | tail -3 | cut -c1-300)
    echo "$reason"
    summary+="| $name | FAIL: $(echo "$reason" | head -1 | cut -c1-150 | tr '|' '/') |"$'\n'
    rc=1
  fi
done
exit $rc
