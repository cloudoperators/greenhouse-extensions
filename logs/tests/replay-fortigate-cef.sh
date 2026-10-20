#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
#
# Replays the FortiGate fixtures through the transform processors of the rendered syslog pipeline, in the collector
# image the chart pins, and checks the resulting attributes against fixtures/fortigate-cef/cases.yaml. Fails on any
# field mismatch and on any warning or error a processor logs.
#
# usage: logs/tests/replay-fortigate-cef.sh   (OTELCOL_IMAGE=<image> to use another collector image)
# needs helm, docker, python3 with PyYAML
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
name="replay-fortigate-cef-$$"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true; rm -rf "$work"' EXIT

helm template logs "$here/../charts" -n logs -f "$here/../charts/ci/test-values.yaml" > "$work/render.yaml"

# Collector config: file input -> the transform processors of logs/syslog_udp, in pipeline order -> debug output.
# A case can preset attributes (as the relay normalization would) to check that nothing set before is overwritten.
image=$(python3 - "$here" "$work" <<'PY'
import json, os, sys, yaml
here, work = sys.argv[1], sys.argv[2]
cases = yaml.safe_load(open(f'{here}/fixtures/fortigate-cef/cases.yaml'))['cases']
with open(f'{work}/input.log', 'w') as f:
    f.writelines(c['message'] + '\n' for c in cases)
for d in yaml.safe_load_all(open(f'{work}/render.yaml')):
    if not d or d.get('kind') != 'OpenTelemetryCollector':
        continue
    cfg = d['spec']['config']
    cfg = yaml.safe_load(cfg) if isinstance(cfg, str) else cfg
    if 'logs/syslog_udp' in cfg.get('service', {}).get('pipelines', {}):
        break
else:
    sys.exit('no rendered collector has a logs/syslog_udp pipeline')
procs = [p for p in cfg['service']['pipelines']['logs/syslog_udp']['processors'] if p.startswith('transform/')]
if 'transform/syslog_device_classification' not in procs:
    sys.exit(f'transform/syslog_device_classification is not in the syslog pipeline: {procs}')
operators = [{'type': 'copy', 'from': 'body', 'to': 'attributes.message'}]
for c in cases:
    for k, v in (c.get('preset') or {}).items():
        operators.append({'type': 'add', 'field': f'attributes["{k}"]', 'value': v, 'if': f'body == {json.dumps(c["message"])}'})
os.makedirs(f'{work}/cfg')
yaml.safe_dump({
    'receivers': {'filelog': {'include': ['/w/input.log'], 'start_at': 'beginning', 'operators': operators}},
    'processors': {p: cfg['processors'][p] for p in procs},
    'exporters': {'debug': {'verbosity': 'detailed'}},
    'service': {'pipelines': {'logs': {'receivers': ['filelog'], 'processors': procs, 'exporters': ['debug']}}},
}, open(f'{work}/cfg/config.yaml', 'w'), sort_keys=False, width=100000)
values = yaml.safe_load(open(f'{here}/../charts/values.yaml'))['openTelemetry']['collectorImage']
print(os.environ.get('OTELCOL_IMAGE') or f"{values['repository']}:{values['tag']}")
PY
)

want=$(grep -c . "$work/input.log")
chmod -R a+rX "$work"
docker run -d --name "$name" -v "$work/input.log:/w/input.log:ro" -v "$work/cfg:/cfg:ro" "$image" --config=/cfg/config.yaml >/dev/null
for _ in $(seq 60); do
  [ "$(docker logs "$name" 2>&1 | grep -c '^LogRecord #')" -ge "$want" ] && break
  [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] || break
  sleep 1
done
sleep 1
docker logs "$name" > "$work/out.txt" 2>&1

python3 - "$here" "$work/out.txt" "$image" <<'PY'
import re, sys, yaml
here, out, image = sys.argv[1:4]
spec = yaml.safe_load(open(f'{here}/fixtures/fortigate-cef/cases.yaml'))
text = open(out, errors='replace').read()
records = []
for block in re.split(r'^LogRecord #\d+\n', text, flags=re.M)[1:]:
    rec = {}
    for m in re.finditer(r'^\s+-> ([^:]+): (\w+)\((.*)\)$', block, flags=re.M):
        key, kind, raw = m.groups()
        # Str and Int are compared as values; any other type is kept as Type(raw) so it never equals an expectation.
        rec[key] = raw if kind == 'Str' else int(raw) if kind == 'Int' else f'{kind}({raw})'
    records.append(rec)
# The transform processors run with error_mode ignore, so a failing statement only shows up in the collector log.
errors = [line for line in text.splitlines()
          if re.search(r'\t(warn|error)\t', line) and '"otelcol.component.kind": "processor"' in line]
failed = 0
if len(records) != len(spec['cases']):
    print(f'FAIL got {len(records)} records, want {len(spec["cases"])}; collector output:')
    print('\n'.join(text.splitlines()[-20:]))
    failed += 1
for case, rec in zip(spec['cases'], records):
    diff = [f'{f}: got {rec.get(f)!r}, want {case["expect"][f]!r}' for f in spec['fields'] if rec.get(f) != case['expect'][f]]
    print(('FAIL ' if diff else 'ok   ') + case['name'])
    for d in diff:
        print('       ' + d)
    failed += bool(diff)
for line in errors:
    print('FAIL collector log: ' + line[:300])
    failed += 1
print(f'{"FAIL" if failed else "ok"}: {len(records)} records, {len(errors)} processor warnings/errors, image {image}')
sys.exit(1 if failed else 0)
PY
