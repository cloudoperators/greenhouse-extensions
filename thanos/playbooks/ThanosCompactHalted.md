# Thanos Compactor Halted Due to Overlapping Blocks

## Problem
The Thanos compactor has halted with an error similar to:
```
critical error detected; halting" err="compaction: ... pre compaction overlap check: overlaps found while gathering blocks. ...
```

```
s=2025-07-25T11:34:26.357181007Z caller=compact.go:559 level=error msg="critical error detected; halting" err="compaction: group 0@3105571489545500179: pre compaction overlap check: overlaps found while gathering blocks. [mint: 1742680710957, maxt: 1742680800000, range: 1m29s, blocks: 2]: <ulid: 01JQ01BAXKEBJSXT0QJ3PAQ63V, mint: 1742673600011, maxt: 1742680800000, range: 1h59m59s>, <ulid: 01JQ3P5BSQK656HMXMW7DREQ3D, mint: 1742680710957, maxt: 1742680800000, range: 1m29s>\n[mint: 1742680800517, maxt: 1742688000000, range: 1h59m59s, blocks: 2]: <ulid: 01JQ08725PXK4D6XD0SB1WYT2E, mint: 1742680800020, maxt: 1742688000000, range: 1h59m59s>, <ulid: 01JQ3P5EH930NGCFHTT9Z87TEY, mint: 1742680800517, maxt: 1742688000000, range: 1h59m59s>"
```

This is caused by overlapping blocks in object storage.

---

## Resolution Steps

### 1. Identify Overlapping Blocks

- Enter the compactor container or a pod with Thanos CLI access.
- Run:
  ```
  thanos tools bucket inspect --objstore.config-file=<your-objstore.yaml> | grep <block_id>
  ```
- Look for blocks with overlapping `mint` and `maxt` time ranges. Note the ULIDs of the offending blocks.

- Use `| grep <block_id>` to compare block sizes and timestamps from the error log.

---

### 2. Decide Which Blocks to Delete

- Prefer deleting the block with the **shorter time range** or the one that appears incomplete (smaller size). 
- Example from logs:
  - `01JQ3P5BSQK656HMXMW7DREQ3D`
  - `01JQ3P5EH930NGCFHTT9Z87TEY`

---

### 3. Remove Overlapping Blocks

- Verify which objectstore bucket is used by your Thanos instance

- Navigate to your object store UI
`https://dashboard.<region>.cloud.sap/<domain>/<project>/object-storage/swift/containers`

- Search and Delete block IDs causing overlap

- **Warning:** This will permanently delete the specified blocks. Always back up your data before proceeding.

---

### 4. Restart the Compactor

- Restart the Thanos compactor deployment/pod to resume normal operation.

---

## Additional Notes

- Overlapping blocks are often caused by misconfigured Prometheus, clock skew, or manual uploads.
- If unsure which block to delete, consult your team or inspect block metadata.
- For more details, see [Thanos Compactor documentation](https://thanos.io/tip/components/compact.md).
---