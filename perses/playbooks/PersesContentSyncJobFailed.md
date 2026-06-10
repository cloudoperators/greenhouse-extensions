# Perses Content Sync Job Failed

## Problem

The Perses **content sync** CronJob runs on a schedule to pull a Perses content
OCI image (dashboards, datasources, etc.) and copy its contents to the Perses
provisioning PVC. This PVC is shared with the Perses pod, which reads
provisioned content directly from it; the CronJob is the writer and Perses
is the reader. This alert fires when the most recent Job spawned by that
CronJob has reached its `backoffLimit` and is in the `Failed` condition.

While this alert is firing:

* The cluster's Perses instance keeps running and serving its current content.
* Newer dashboards published to the OCI image are **not** being
  rolled out to Perses.
* Provisioned content on the PVC is effectively stale.

## Impact

* **Stale content:** Existing dashboards continue to work. New or updated
  content shipped via the content image will not appear in Perses until the
  sync succeeds again.

## Diagnosis

### 1. Identify the failing Job

Use the alert labels (`namespace`, `job_name`), or list the recent Jobs
spawned by the CronJob:

```bash
kubectl get jobs -n <namespace> -l plugindefinition=perses | grep content-sync
```

### 2. Inspect the Job

```bash
kubectl describe job <job_name> -n <namespace>
```

Check `Conditions`, `Events`, and the pod counts (`Failed`, `Succeeded`).

### 3. Read the pod logs

```bash
kubectl logs job/<job_name> -c content-sync -n <namespace> --tail=500
```

The CronJob retains up to 3 failed Jobs (`failedJobsHistoryLimit: 3`), so
logs are typically available while this alert is firing. If the pod has been
garbage-collected, fall back to the cluster's log aggregator (e.g. OpenSearch) and query by `namespace` and `job_name`.

### 4. Inspect the CronJob

```bash
kubectl describe cronjob <release>-content-sync -n <namespace>
```

## Resolution Steps

### Scenario A: Cannot reach or pull the OCI content image

**Diagnosis:** Logs show `crane digest` or `crane export` errors such as
`UNAUTHORIZED`, `MANIFEST_UNKNOWN`, `connection refused`, DNS errors, or TLS
failures.

1. Verify `contentSync.ociImageRef` in the Helm values is correct (registry,
   repository, tag/digest).
2. Confirm the registry is reachable from the pod's network.
3. For private registries, verify pull credentials have not expired.

### Scenario B: Image pull error for the content-sync container

**Diagnosis:** Pod events show `ErrImagePull` / `ImagePullBackOff` on the
`content-sync` container.

1. Verify `contentSync.image.repository` and `contentSync.image.tag`.
2. Verify the cluster can pull from the registry hosting the content-sync
   image.

### Scenario C: PVC mount or storage issues

**Diagnosis:** Logs or pod events reference the volume `perses-content-volume`
or the mount path (`contentSync.provisioningMountPath`). Common signs:
`MountVolume.SetUp failed`, "read-only file system" when copying.

1. Resolve the exact PVC name being mounted by the failing Job:
   ```bash
   PVC=$(kubectl get job <job_name> -n <namespace> \
     -o jsonpath='{.spec.template.spec.volumes[?(@.name=="perses-content-volume")].persistentVolumeClaim.claimName}')
   echo "$PVC"
   ```
2. Inspect the PVC and its bound state:
   ```bash
   kubectl describe pvc "$PVC" -n <namespace>
   kubectl get pvc "$PVC" -n <namespace> -o wide
   ```
3. Ensure the PVC is `Bound` and the underlying storage is healthy.
4. If a stale pod still holds the volume, ensure no leftover pod is attached:
   ```bash
   kubectl get pods -n <namespace> -l app.kubernetes.io/name=perses
   ```

## Manually re-run the sync

After fixing the underlying issue, trigger an immediate run instead of
waiting for the next scheduled tick:

```bash
kubectl create job --from=cronjob/<release>-content-sync \
  <release>-content-sync-rerun-$(date +%s) -n <namespace>
```


## Clear the firing alert

Once the underlying issue is fixed (and ideally a manual re-run has
succeeded), the lingering failed Job must be deleted to resolve
`PersesContentSyncJobFailed` alert.


1. List content-sync Jobs (failed ones typically show `0/1` under
   `COMPLETIONS`):

   ```bash
   kubectl get jobs -n <namespace> -l plugindefinition=perses | grep content-sync
   ```

2. Delete the failed Job (this also removes its pod):

   ```bash
   kubectl delete job <failed_job_name> -n <namespace>
   ```
