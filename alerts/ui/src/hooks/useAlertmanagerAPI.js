import { useEffect } from "react"
import useStore from "./useStore"

let workerUrl = new URL("workers/api.js", import.meta.url)

const loadWorker = async () => {
  return fetch(workerUrl)
    .then((r) => r.blob())
    .then((blob) => {
      var blobUrl = window.URL.createObjectURL(blob)
      return new Worker(blobUrl, { type: "module" })
    })
}

const useAlertmanagerAPI = (apiEndpoint) => {
  const setAlerts = useStore((state) => state.alerts.setItems)
  const setIsLoading = useStore((state) => state.alerts.setIsLoading)
  const setIsUpdating = useStore((state) => state.alerts.setIsUpdating)

  loadWorker()

  let cleanup
  // Create a web worker to get updates from the alert manager api
  useEffect(() => {
    if (!apiEndpoint) return
    // set alerts state to loading
    setIsLoading(true)

    loadWorker().then((worker) => {
      // receive messages from worker
      worker.onmessage = (e) => {
        const action = e.data.action
        switch (action) {
          case "ALERTS_UPDATE":
            setAlerts(e.data.items)
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
}

export default useAlertmanagerAPI
