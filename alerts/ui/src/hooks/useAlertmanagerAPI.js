import { useEffect } from "react"
import useStore from "./useStore"

const useAlertmanagerAPI = (apiEndpoint) => {
  const setAlerts = useStore((state) => state.alerts.setItems)
  const setIsLoading = useStore((state) => state.alerts.setIsLoading)
  const setIsUpdating = useStore((state) => state.alerts.setIsUpdating)

  // on app initial load save Endpoint and URL_STATE_KEY so it can be
  // used from overall in the application
  useEffect(() => {
    if (!apiEndpoint) return
    setIsLoading(true)
    let worker = new Worker(new URL("../api/worker.js", import.meta.url), {
      type: "module",
    })

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

    worker.postMessage({ action: "ALERTS_CONFIGURE", apiEndpoint, limit: 100 })

    return () => worker.terminate()
  }, [apiEndpoint])
}

export default useAlertmanagerAPI
