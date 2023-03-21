import { useEffect, useState } from "react"
import useStore from "./useStore"

let workerUrl = new URL("workers/api.js", import.meta.url)

const loadWorker = fetch(workerUrl)
  .then((r) => r.blob())
  .then((blob) => {
    var blobUrl = window.URL.createObjectURL(blob)
    return new Worker(blobUrl, { type: "module" })
  })

const useAlertmanagerAPI = (apiEndpoint) => {
  const setAlerts = useStore((state) => state.alerts.setItems)
  const setSeverityCountsPerRegion = useStore((state) => state.alerts.setSeverityCountsPerRegion)
  const setTotalCounts = useStore((state) => state.alerts.setTotalCounts)
  const setIsLoading = useStore((state) => state.alerts.setIsLoading)
  const setIsUpdating = useStore((state) => state.alerts.setIsUpdating)
  const isUserActive = useStore((state) => state.userActivity.isActive)

  /** Counts total items and total severities */
  const countTotalSeverities = (items) => {
      let total = items.length
      let critical = items.reduce((acc, current) => current.labels?.severity === "critical" ? ++acc : acc, 0)
      let warning = items.reduce((acc, current) => current.labels?.severity === "warning" ? ++acc : acc, 0)
      let info = items.reduce((acc, current) => current.labels?.severity === "info" ? ++acc : acc, 0)
      
      return {total, critical, warning, info}
  }
  
  /** Counts severities per region */
  const countSeveritiesPerRegion = (items) => {
    let severityCountsPerRegion = {}
    // find all regions (deduplicate by using Map), sort by region name
    const regions = [...new Map(items.map(item => [item.labels?.region, item.labels?.region]).sort()).keys()]

    regions.forEach((region) => {
      let critical = items.reduce((acc, current) => current.labels?.region === region && current.labels?.severity === "critical" ? ++acc : acc, 0)
      let warning = items.reduce((acc, current) => current.labels?.region === region && current.labels?.severity === "warning" ? ++acc : acc, 0)
      let info = items.reduce((acc, current) => current.labels?.region === region && current.labels?.severity === "info" ? ++acc : acc, 0)
      
      severityCountsPerRegion[region] = {critical, warning, info}
    })
  
    return severityCountsPerRegion
  }

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
            setAlerts(e.data.items)
            setSeverityCountsPerRegion(countSeveritiesPerRegion(e.data.items))
            setTotalCounts(countTotalSeverities(e.data.items))
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
