#!/bin/bash
# Install OpenSearch snapshot lifecycle: register S3 repositories, install
# ISM/SM policies, and attach policies to existing backing indices.
#
# Idempotent — re-running is safe; policies are versioned via schema_version.
#
# Required env:
#   CLUSTER_HOST         e.g. https://opensearch.{namespace}.svc.cluster.local:9200
#   ADMIN_USER           OpenSearch admin username
#   ADMIN_PASSWORD       OpenSearch admin password
#   STREAMS              space-separated stream names (e.g. "audit hermes")
#   FILE_SCHEMA_VERSION  integer; bump to force policy update
#
# Each stream {name} expects four files in /scripts/:
#   ds-{name}-ism.json
#   remote-{name}-ism.json
#   snapshot-{name}-delete-policy.json
#   snapshot-repo-{name}.json

set -uo pipefail

CLUSTER_HOST_BASE=$(echo "${CLUSTER_HOST}" | sed -E 's|https?://([^:/]+).*|\1|')

NETRC_FILE=$(mktemp)
trap "rm -f ${NETRC_FILE}" EXIT
chmod 600 "${NETRC_FILE}"
echo "machine ${CLUSTER_HOST_BASE} login ${ADMIN_USER} password ${ADMIN_PASSWORD}" > "${NETRC_FILE}"

# Wait for the cluster to be reachable.
echo "[snapshot-lifecycle] waiting for ${CLUSTER_HOST}..."
for i in $(seq 1 60); do
  if curl -sk --netrc-file "${NETRC_FILE}" "${CLUSTER_HOST}/" >/dev/null; then
    echo "[snapshot-lifecycle] cluster reachable"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "[snapshot-lifecycle] cluster not reachable after 60s, giving up" >&2
    exit 1
  fi
  sleep 1
done

FILEPATH=/scripts
TMPPATH=/tmp

# Apply or update an ISM/SM policy with optimistic concurrency on schema_version.
#   $1 = policy kind (ism|sm)
#   $2 = policy id (e.g. ds-hermes-ism)
#   $3 = path to JSON file
#   $4 = jq path to the schema_version field in the cluster's stored doc
apply_policy() {
  local kind=$1 id=$2 file=$3 schema_path=$4
  local base
  case "$kind" in
    ism) base="${CLUSTER_HOST}/_plugins/_ism/policies" ;;
    sm)  base="${CLUSTER_HOST}/_plugins/_sm/policies" ;;
    *)   echo "[snapshot-lifecycle] unknown kind: $kind" >&2; return 1 ;;
  esac
  local endpoint="${base}/${id}"

  # Substitute the snapshot name placeholder (only relevant for ds-* ISM policies).
  sed -i "s/_SNAPSHOT_NAME_/{ctx.index}/g" "$file"

  local code
  code=$(curl -sk -o /dev/null -w "%{http_code}" --netrc-file "${NETRC_FILE}" -XGET "${endpoint}")
  if [ "$code" = "404" ]; then
    echo "[snapshot-lifecycle] installing ${kind}/${id}"
    curl -sk --netrc-file "${NETRC_FILE}" -XPUT "${endpoint}" -H 'Content-Type: application/json' -d @"${file}"
    return $?
  fi

  local resp seq prim cluster_schema
  resp=$(curl -sk --netrc-file "${NETRC_FILE}" -XGET "${endpoint}")
  seq=$(echo "$resp" | jq -r '._seq_no')
  prim=$(echo "$resp" | jq -r '._primary_term')
  cluster_schema=$(echo "$resp" | jq -r "${schema_path} // 0")

  if [ "${FILE_SCHEMA_VERSION}" -gt "${cluster_schema}" ]; then
    echo "[snapshot-lifecycle] updating ${kind}/${id} (cluster=${cluster_schema}, file=${FILE_SCHEMA_VERSION})"
    curl -sk --netrc-file "${NETRC_FILE}" -XPUT "${endpoint}?if_seq_no=${seq}&if_primary_term=${prim}" -H 'Content-Type: application/json' -d @"${file}"
  else
    echo "[snapshot-lifecycle] ${kind}/${id} unchanged (schema=${cluster_schema})"
  fi
}

# Register the S3 snapshot repository for a stream.
#   $1 = stream name
register_repo() {
  local stream=$1
  local repo_file="${FILEPATH}/snapshot-repo-${stream}.json"
  if [ ! -f "${repo_file}" ]; then
    echo "[snapshot-lifecycle] no repo definition for ${stream}, skipping"
    return 0
  fi
  local repo_name
  repo_name=$(jq -r '.name // empty' "${repo_file}")
  if [ -z "${repo_name}" ]; then
    echo "[snapshot-lifecycle] missing repository name for ${stream}" >&2
    return 1
  fi
  echo "[snapshot-lifecycle] registering snapshot repository ${repo_name}"
  curl -sk --netrc-file "${NETRC_FILE}" -XPUT "${CLUSTER_HOST}/_snapshot/${repo_name}" \
    -H 'Content-Type: application/json' \
    -d "$(jq 'del(.name)' "${repo_file}")"
}

for stream in ${STREAMS}; do
  register_repo "${stream}"

  for policy in "ds-${stream}-ism" "remote-${stream}-ism"; do
    src="${FILEPATH}/${policy}.json"
    dst="${TMPPATH}/${policy}.json"
    if [ ! -f "${src}" ]; then
      echo "[snapshot-lifecycle] missing ${src}, skipping"
      continue
    fi
    cp "${src}" "${dst}"
    apply_policy ism "${policy}" "${dst}" '.policy.schema_version'
  done

  sm_policy="snapshot-${stream}-delete-policy"
  src="${FILEPATH}/${sm_policy}.json"
  dst="${TMPPATH}/${sm_policy}.json"
  if [ -f "${src}" ]; then
    cp "${src}" "${dst}"
    apply_policy sm "${sm_policy}" "${dst}" '.sm_policy.schema_version'
  fi
done

# Attach the ds-{stream}-ism policy to any existing backing indices that don't
# already have a policy attached. ISM ism_templates apply only at index creation,
# so backing indices that pre-existed our policy install need explicit attachment.
for stream in ${STREAMS}; do
  policy="ds-${stream}-ism"
  explain="${TMPPATH}/explain-${stream}.json"
  curl -sk --netrc-file "${NETRC_FILE}" \
    -XGET "${CLUSTER_HOST}/_plugins/_ism/explain/.ds-${stream}-*" -o "${explain}"
  unmanaged=$(jq -r '
    to_entries[]
    | select(.key != "total_managed_indices" and .key != "enabled")
    | select((.value.policy_id // "") == "")
    | .key
  ' "${explain}")
  for idx in ${unmanaged}; do
    echo "[snapshot-lifecycle] attaching ${policy} to ${idx}"
    curl -sk --netrc-file "${NETRC_FILE}" \
      -XPOST "${CLUSTER_HOST}/_plugins/_ism/add/${idx}" \
      -H 'Content-Type: application/json' \
      -d "{\"policy_id\": \"${policy}\"}"
  done
done

echo "[snapshot-lifecycle] done"
