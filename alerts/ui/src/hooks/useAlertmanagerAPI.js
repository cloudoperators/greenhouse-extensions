import { useEffect } from "react"
import useStore from "./useStore"
let workerUrl = new URL("workers/api.js", import.meta.url)

const loadWorker = fetch(workerUrl)
  .then((r) => r.blob())
  .then((blob) => {
    var blobUrl = window.URL.createObjectURL(blob)
    return new Worker(blobUrl, { type: "module" })
  })

const useAlertmanagerAPI = (apiEndpoint) => {
  const setAlertsData = useStore((state) => state.alerts.setAlertsData)
  const setIsLoading = useStore((state) => state.alerts.setIsLoading)
  const setIsUpdating = useStore((state) => state.alerts.setIsUpdating)
  const isUserActive = useStore((state) => state.userActivity.isActive)

  // Create a web worker to get updates from the alert manager api
  useEffect(() => {
    if (!apiEndpoint) return
    let cleanup

    // set alerts state to loading
    setIsLoading(true)

    loadWorker.then((worker) => {
      // receive messages from worker
      worker.onmessage = (e) => {
        const action = e.data.action
        switch (action) {
          case "ALERTS_UPDATE":
            setAlertsData({ items: e.data.alerts, counts: e.data.counts })
            break
          case "ALERTS_FETCH_START":
            setIsUpdating(true)
            break
          case "ALERTS_FETCH_END":
            setIsUpdating(false)
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

    return () => cleanup && cleanup()
  }, [apiEndpoint])

  useEffect(() => {
    if (isUserActive === undefined) return
    loadWorker.then((worker) => {
      worker.postMessage({
        action: "ALERTS_CONFIGURE",
        watch: isUserActive,
      })
    })
  }, [isUserActive])
}

export default useAlertmanagerAPI
