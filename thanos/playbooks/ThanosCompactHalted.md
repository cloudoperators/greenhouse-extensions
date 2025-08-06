
# Thanos Compactor Troubleshooting Playbook

## Table of Contents

1. [Thanos Compactor Halted Due to Overlapping Blocks](#thanos-compactor-halted-due-to-overlapping-blocks)
2. [Thanos component has disappeared](#Thanos-component-has-disappeared)
3. [Chunk critical error](#Chunk-critical-error)
 
 ---

## Thanos Compactor Halted Due to Overlapping Blocks

### Problem
The Thanos compactor has halted with an error similar to:
```
critical error detected; halting" err="compaction: ... pre compaction overlap check: overlaps found while gathering blocks. ...
```
Example:
```
s=2025-07-25T11:34:26.357181007Z caller=compact.go:559 level=error msg="critical error detected; halting" err="compaction: group 0@3105571489545500179: pre compaction overlap check: overlaps found while gathering blocks. [mint: 1742680710957, maxt: 1742680800000, range: 1m29s, blocks: 2]: <ulid: 01JQ01BAXKEBJSXT0QJ3PAQ63V, mint: 1742673600011, maxt: 1742680800000, range: 1h59m59s>, <ulid: 01JQ3P5BSQK656HMXMW7DREQ3D, mint: 1742680710957, maxt: 1742680800000, range: 1m29s>\n[mint: 1742680800517, maxt: 1742688000000, range: 1h59m59s, blocks: 2]: <ulid: 01JQ08725PXK4D6XD0SB1WYT2E, mint: 1742680800020, maxt: 1742688000000, range: 1h59m59s>, <ulid: 01JQ3P5EH930NGCFHTT9Z87TEY, mint: 1742680800517, maxt: 1742688000000, range: 1h59m59s>"
```

This is caused by overlapping blocks in your object storage.

---

### Resolution Steps

#### 1. Identify Overlapping Blocks

- Enter the compactor container or a pod with Thanos CLI access.

- Run: ``` thanos tools bucket inspect --objstore.config-file=<your-objstore.yaml> | grep <block_id> ```

- You will see output similar to the following, showing details for each block ULID:

| ULID                      | MIN TIME            | MAX TIME            | DURATION        | AGE              | NUM SAMPLES | NUM SERIES     | NUM CHUNKS  | LEVEL      | COMPACTED   | LABELS                                                                                                                                                                                                 | DELETION   | SOURCE    |
|---------------------------|---------------------|---------------------|-----------------|------------------|-------------|----------------|-------------|------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|-----------|
| 01JWTG9RS2PVHHFZKFCCBZH0RV | 2025-06-03T06:00:00Z | 2025-06-03T08:00:00Z | 1h59m59.95s    | 38h0m0.05s      | 193,216     | 44,122,225     | 379,866     | 1          | false       | cluster=cluster-us,cluster_type=observability,organization=ccloud,prometheus=kube-monitoring/kube-monitoring,prometheus_replica=prometheus-kube-monitoring-0,region=us | 0s         | sidecar   |
| 01JWZ95H85J8SZEN09Z3W8MQPP | 2025-06-03T08:00:00Z | 2025-06-05T00:00:00Z | 40h0m0s        | 0s              | 411,006     | 903,753,062    | 7,661,746   | 3          | false       | cluster=cluster-us,cluster_type=observability,prometheus=kube-monitoring/kube-monitoring,prometheus_replica=prometheus-kube-monitoring-0,region=us                     | 0s         | compactor |

This table helps you to identify block time ranges, sizes, and sources for troubleshooting overlaps.

- Look for blocks with overlapping `mint` and `maxt` time ranges. Note the ULIDs of the offending blocks.

- Use `| grep <block_id>` to compare block sizes and timestamps from the error log.

---

#### 2. Decide Which Blocks to Delete

- Prefer deleting the block with the **shorter time range** or the one that appears incomplete (smaller size). 
- Example from logs:
  - `01JQ3P5BSQK656HMXMW7DREQ3D`
  - `01JQ3P5EH930NGCFHTT9Z87TEY`

---

#### 3. Remove Overlapping Blocks

- Verify which objectstore bucket is used by your Thanos instance

- Navigate to your object store UI

- Search and delete block IDs causing overlap

- **Warning:** This will permanently delete the specified blocks. Always back up your data before proceeding.

---

#### 4. Restart the Compactor

- Restart the Thanos compactor deployment/pod to resume normal operation.

---

### Additional Notes

- Overlapping blocks are often caused by misconfigured Prometheus, clock skew, or manual uploads.
- If unsure which block to delete, consult your team or inspect block metadata.
- For more details, see [Thanos Compactor documentation](https://thanos.io/tip/components/compact.md).
---

## Thanos component has disappeared.

### Problem

The Thanos job (thanos-...-compactor) responsible for shrinking the store data is not running anymore. 
The error itself is harmless, no productive impact, but it should be fixed to avoid unnecessary growth of the swift store. 

## Solution

1. Check the logs of the Thanos compactor in question

    ```bash
    kubectl logs --follow $podName
    ```

    Usually you would see some critical error like this
    ```
    level=error ts=2023-04-01T21:44:13.805210208Z caller=compact.go:488 msg="critical error detected; halting" err="compaction: group 0@16113311641286135401: compact blocks [/data/compact/0@16113311641286135401/01GWY7K16T83Y35W654CWB8W15 /data/compact/0@16113311641286135401/01GWYEER9Q3FSY4ST5M2J32SJ0 /data/compact/0@16113311641286135401/01GWYNAFHNAZY9SV5JTB3W1C07 /data/compact/0@16113311641286135401/01GWYW66T6WDGQD3G7HDJ6GGCT]: 2 errors: populate block: context canceled; context canceled" 
    ```
    
    ```
    level=info ts=2023-04-27T05:43:18.591882979Z caller=http.go:103 service=http/server component=compact msg="internal server is shutdown gracefully" err="could not sync metas: filter metas: filter blocks marked for deletion: get file: 01GYH4WNQKAXY1Y4RN1K5J1R8Q/deletion-mark.json: open object: Timeout when reading or writing data"
    level=info ts=2023-04-27T05:43:18.591951424Z caller=intrumentation.go:81 msg="changing probe status" status=not-healthy reason="could not sync metas: filter metas: filter blocks marked for deletion: get file: 01GYH4WNQKAXY1Y4RN1K5J1R8Q/deletion-mark.json: open object: Timeout when reading or writing data"
    level=error ts=2023-04-27T05:43:19.742219509Z caller=compact.go:488 msg="critical error detected; halting" err="compaction: group 0@2754565673212689501: compact blocks [/data/compact/0@2754565673212689501/01GYZEZNMR42383F8BXZHE91A0 /data/compact/0@2754565673212689501/01GYZNVCWRNMVJZYY7MZD4SJQM /data/compact/0@2754565673212689501/01GYZWQ44S29Y97MV0CKBEVKRA /data/compact/0@2754565673212689501/01GZ03JVCRRQ9E6HAQ9333P9SY]: 2 errors: populate block: context canceled; context canceled"
    ```

2. Kick the pod.

3. Check the log again like in in step `1.`.

## Chunk critical error

### Problem

Some block error prohibits Thanos from continuing to compact. The faulty block needs to be identified and removed in your object storage (Swift, S3, Ceph, ...).

### Solution

#### 1. Check the logs of the Thanos compactor in question

    ```bash
    kubectl logs --follow $podName
    ```

    Usually you would see some critical error like this:
    ```
    level=error ts=2023-11-09T12:23:35.120966651Z caller=compact.go:487 msg="critical error detected; halting" err="compaction: group 0@7529044506654606473: compact blocks [/data/compact/0@7529044506654606473/01HE8PG6C507J89N60T3SKQN3S /data/compact/0@7529044506654606473/01HE8XBXM3AP4WDCS25DKJ6W4J /data/compact/0@7529044506654606473/01HE947MW4JBDY3648JSVYKPAW /data/compact/0@7529044506654606473/01HE9B3C499RNJ4SM5V8EKM0ZG]: populate block: chunk iter: cannot populate chunk 8 from block 01HE9B3C499RNJ4SM5V8EKM0ZG: segment index 0 out of range"

    ```

    If you can't see it, kick the pod and watch the logs straight, to catch the initial error. It might be obfuscated by appending messages by the time you are looking at it.

#### 2. Find the Secret CR Used by Your Thanos Compactor
- Check the `Deployment` or `StatefulSet` manifest for the Thanos compactor to find the name of the    Secret containing the object storage configuration (often referenced as `--objstore.config` or `--objstore.config-file`).
- Example command to find the Secret reference:
    ```bash
    kubectl get deployment -n <namespace> -o yaml | grep objstore
    ```
- Once you have the Secret name, retrieve its contents:
    ```bash
    kubectl get secret <secret-name> -n <namespace> -o yaml
    ```
- Review the Secret to identify the object storage endpoint, bucket, and credentials. This tells you which object storage instance you need to access to delete the problematic blocks.

#### 3. Remove faulty Blocks

- Delete the folder, it is empty anyway. You are also safe to delete it, if it has no `chunks` folder.

- Verify which objectstore bucket is used by your Thanos instance

- Navigate to your object store UI

- Search and delete block IDs causing faults

- **Warning:** This will permanently delete the specified blocks. Always back up your data before proceeding.

#### 4. Kick the pod.

    ```kubectl delete pod thanos-kubernetes-compactor-....```

