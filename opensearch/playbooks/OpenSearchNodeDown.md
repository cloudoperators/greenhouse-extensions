---
title: OpenSearchNodeDown
weight: 20
---

# OpenSearchNodeDown

## Problem

OpenSearch master or data pods are crash-looping due to full disk or other issues, causing `KubernetesPodRestartingTooMuch` alerts or pod failures.

## Impact

- Cluster instability and potential data loss
- Reduced cluster performance and availability
- Potential service degradation for applications depending on the cluster

## Diagnosis

1. **Check pod logs**: Check the pod logs in the respective scaleout cluster for errors such as `No space left on device`:
   ```bash
   kubectl logs opensearch-logs-master-0 -n opensearch-logs
   ```

   Example error:
   ```
   14:09:51.872 [main] ERROR org.elasticsearch.bootstrap.ElasticsearchUncaughtExceptionHandler - uncaught exception in thread [main]
   org.elasticsearch.bootstrap.StartupException: ElasticsearchException[failed to load metadata]; nested: IOException[No space left on device];
   ```

2. **Check pod status**: Verify which pods are down and their current status:
   ```bash
   kubectl get pods -n opensearch-logs
   ```

3. **Check volume status**: If the pod is failing due to disk space issues, it may not be possible to check the volumes content from the Elasticsearch pod directly.

## Resolution Steps

1. **Delete StatefulSet without removing pods**: If the pod is failing due to disk space issues, delete the StatefulSet without removing the pods:
   ```bash
   kubectl delete statefulset opensearch-logs-master --cascade=orphan -n opensearch-logs
   ```

2. **Mount PVC in alpine pod**: Create a plain alpine pod to mount the PersistentVolumeClaim:
   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     labels:
       run: alpine
     name: alpine
     namespace: opensearch-logs
   spec:
     containers:
     - image: keppel.eu-de-1.cloud.sap/ccloud-dockerhub-mirror/library/alpine:3.17
       name: alpine
       command: [ "/bin/sh", "-c", "--" ]
       args: [ "while true; do sleep 30; done;" ]
       volumeMounts:
       - mountPath: /usr/share/opensearch/data
         name: opensearch-logs-master
     dnsPolicy: ClusterFirst
     restartPolicy: Always
     volumes:
     - name: opensearch-logs-master
       persistentVolumeClaim:
         claimName: opensearch-logs-master-opensearch-logs-master-0
     tolerations:
     - effect: NoSchedule
       key: dedicated
       operator: Equal
       value: payload
   ```

3. **Access the PVC**: Access the PVC with the alpine pod:
   ```bash
   kubectl exec -ti alpine -- sh -n opensearch-logs
   ```

4. **Check disk usage**: Check if the volume is actually full:
   ```bash
   df -h
   ```

5. **Check volume content**: Check the volumes content to identify the culprit:
   ```bash
   ls -lah /usr/share/opensearch/data
   ```

6. **Clean up large files**: **ONLY** delete files if you are certain they will not be missed. If there are large displaced files, such as `hprof` files, delete them.

7. **Delete alpine pod**: After freeing space in the volume, delete the alpine pod to avoid `MultipleAttachErrors`:
   ```bash
   kubectl delete pod -n opensearch-logs alpine
   ```

8. **Trigger pipeline**: Trigger the pipeline of the respective region to redeploy the StatefulSet, which will then recreate the missing Elasticsearch master pod. To avoid side-effects, always use the `re-run with same inputs` feature of concourse.

**Note**: This playbook can also be followed for data pods by adjusting the pod names and PVC names accordingly.
