import { useEffect } from "react"
import useStore from "./useStore"

const useAlertmanagerAPI = (apiEndpoint) => {
  const setAlerts = useStore((state) => state.alerts.setItems)
  const setIsLoading = useStore((state) => state.alerts.setIsLoading)
  const setIsUpdating = useStore((state) => state.alerts.setIsUpdating)

  // Create a web worker to get updates from the alert manager api
  useEffect(() => {
    if (!apiEndpoint) return
    // set alerts state to loading
    setIsLoading(true)

    // create the worker
    let worker = new Worker(new URL("../api/worker.js", import.meta.url), {
      type: "module",
    })

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
      limit: 100,
      watch: true,
      watchInterval: 300000, // 5 min
      initialFetch: true,
    })

    return () => worker.terminate()
  }, [apiEndpoint])
}

export default useAlertmanagerAPI
