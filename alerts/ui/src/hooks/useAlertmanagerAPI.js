import { useEffect } from "react"
import {
  useAlertsActions,
  useUserIsActive,
  useSilencesActions,
  useSilencesLocalItems,
} from "./useStore"

let alertsWorkerUrl = new URL("workers/api.js", import.meta.url)
let silencesWorkerUrl = new URL("workers/silences.js", import.meta.url)

const loadAlertsWorker = fetch(alertsWorkerUrl)
  .then((r) => r.blob())
  .then((blob) => {
    var blobUrl = window.URL.createObjectURL(blob)
    return new Worker(blobUrl, { type: "module" })
  })

const loadSilencesWorker = fetch(silencesWorkerUrl)
  .then((r) => r.blob())
  .then((blob) => {
    var blobUrl = window.URL.createObjectURL(blob)
    return new Worker(blobUrl, { type: "module" })
  })

const useAlertmanagerAPI = (apiEndpoint) => {
  const {
    setAlertsData,
    setFilteredItems,
    setIsLoading: setAlertsIsLoading,
    setIsUpdating: setAlertsIsUpdating,
  } = useAlertsActions()
  const isUserActive = useUserIsActive()
  const {
    setSilences,
    setIsUpdating: setSilencesIsUpdating,
    setIsLoading: setSilencesIsLoading,
  } = useSilencesActions()

  // Create a web worker to get updates from the alert manager api
  useEffect(() => {
    if (!apiEndpoint) return
    let cleanup

    // set alerts state to loading
    setAlertsIsLoading(true)

    loadAlertsWorker.then((worker) => {
      // receive messages from worker
      worker.onmessage = (e) => {
        const action = e.data.action
        switch (action) {
          case "ALERTS_UPDATE":
            setAlertsData({ items: e.data.alerts, counts: e.data.counts })
            break
          case "ALERTS_FETCH_START":
            setAlertsIsUpdating(true)
            break
          case "ALERTS_FETCH_END":
            setAlertsIsUpdating(false)
            break
        }
      }
      // initial config
      worker.postMessage({
        action: "ALERTS_CONFIGURE",
        apiEndpoint,
        limit: false,
        watch: true,
        watchInterval: 300000, // 5 min
        initialFetch: true,
      })

      cleanup = () => worker.terminate()
    })

    setSilencesIsLoading(true)

    loadSilencesWorker.then((worker) => {
      // receive messages from worker
      worker.onmessage = (e) => {
        const action = e.data.action
        switch (action) {
          case "SILENCES_UPDATE":
            console.log("SILENCES_UPDATE:::::", e.data?.silences)
            setSilences({
              items: e.data?.silences,
              itemsByState: e.data?.sortedSilences,
            })
            break
          case "SILENCES_FETCH_START":
            console.log("SILENCES_FETCH_START:::::")
            setSilencesIsUpdating(true)
            break
          case "SILENCES_FETCH_END":
            console.log("SILENCES_FETCH_END:::::")
            setSilencesIsUpdating(false)
            break
        }
      }

      // initial config
      worker.postMessage({
        action: "SILENCES_CONFIGURE",
        apiEndpoint: apiEndpoint,
      })

      cleanup = () => worker.terminate()
    })

    return () => cleanup && cleanup()
  }, [apiEndpoint])

  // enable/disable watching in the workers
  useEffect(() => {
    if (isUserActive === undefined) return
    loadAlertsWorker.then((worker) => {
      worker.postMessage({
        action: "ALERTS_CONFIGURE",
        watch: isUserActive,
      })
    })
    loadSilencesWorker.then((worker) => {
      worker.postMessage({
        action: "SILENCES_CONFIGURE",
        watch: isUserActive,
      })
    })
  }, [isUserActive])

  // as soon as we have locally some silences we refetch the them
  useEffect(() => {
    if (!useSilencesLocalItems || useSilencesLocalItems?.length <= 0) return
    loadSilencesWorker.then((worker) => {
      worker.postMessage({
        action: "SILENCES_FETCH",
      })
    })
  }, [useSilencesLocalItems])
}

export default useAlertmanagerAPI
