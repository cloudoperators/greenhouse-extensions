/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react"
import {
  useAlertsActions,
  useUserIsActive,
  useSilencesActions,
  useSilencesLocalItems,
} from "./useAppStore"

const createWorker = (path) => {
  return fetch(new URL(path, import.meta.url))
    .then((r) => r.blob())
    .then((blob) => {
      var blobUrl = window.URL.createObjectURL(blob)
      let worker

      const createWorker = () => {
        if (!worker) worker = new Worker(blobUrl, { type: "module" })
        return worker
      }

      const stopWorker = () => {
        if (!worker) return
        worker.terminate()
        worker = null
      }

      return { createWorker, stopWorker }
    })
}

// create workers
const alertsWorker = createWorker("workers/alerts.js")
const silencesWorker = createWorker("workers/silences.js")

const useAlertmanagerAPI = (apiEndpoint) => {
  const {
    setAlertsData,
    setIsLoading: setAlertsIsLoading,
    setIsUpdating: setAlertsIsUpdating,
    setError: setAlertsError,
  } = useAlertsActions()
  const isUserActive = useUserIsActive()
  const {
    setSilences,
    setIsUpdating: setSilencesIsUpdating,
    setIsLoading: setSilencesIsLoading,
    setError: setSilencesError,
  } = useSilencesActions()

  //Setup web workers
  useEffect(() => {
    let cleanupAlertsWorker
    let cleanupSilencesWorker

    alertsWorker.then(({ createWorker, stopWorker }) => {
      const worker = createWorker()
      console.log("Worker::Setting up ALERTS worker", worker)

      // receive messages from worker
      worker.onmessage = (e) => {
        const action = e.data.action
        switch (action) {
          case "ALERTS_UPDATE":
            console.log("Worker::ALERT_UPDATE::", e.data)
            setAlertsData({ items: e.data.alerts, counts: e.data.counts })
            break
          case "ALERTS_FETCH_START":
            console.log("Worker::ALERTS_FETCH_START::")
            setAlertsIsUpdating(true)
            break
          case "ALERTS_FETCH_END":
            console.log("Worker::ALERTS_FETCH_END::")
            setAlertsIsUpdating(false)
            break
          case "ALERTS_FETCH_ERROR":
            console.log("Worker::ALERTS_FETCH_ERROR::", e.data.error)
            setAlertsIsUpdating(false)
            // error comes as object string and have to be parsed
            setAlertsError(e.data.error)
            break
        }
      }

      cleanupAlertsWorker = () => {
        console.log("Worker::Terminating Alerts Worker")
        return stopWorker()
      }
    })

    silencesWorker.then(({ createWorker, stopWorker }) => {
      const worker = createWorker()
      console.log("Worker::Setting up SILENCES worker")

      // receive messages from worker
      worker.onmessage = (e) => {
        const action = e.data.action
        switch (action) {
          case "SILENCES_UPDATE":
            console.log("Worker::SILENCES_UPDATE::", e.data)
            setSilences({
              items: e.data?.silences,
              itemsHash: e.data?.silencesHash,
              itemsByState: e.data?.silencesBySate,
            })
            break
          case "SILENCES_FETCH_START":
            console.log("Worker::SILENCES_FETCH_START::")
            setSilencesIsUpdating(true)
            break
          case "SILENCES_FETCH_END":
            console.log("Worker::SILENCES_FETCH_END::")
            setSilencesIsUpdating(false)
            break
          case "SILENCES_FETCH_ERROR":
            console.log("Worker::SILENCES_FETCH_ERROR::", e.data.error)
            setSilencesIsUpdating(false)
            // error comes as object string and have to be parsed
            setSilencesError(e.data.error)
            break
        }
      }

      cleanupSilencesWorker = () => {
        console.log("Worker::Terminating Silences Worker")
        return stopWorker()
      }
    })

    return () => {
      cleanupAlertsWorker && cleanupAlertsWorker()
      cleanupSilencesWorker && cleanupSilencesWorker()
    }
  }, [])

  // Reconfigure the workers each time we get a new endpoint
  useEffect(() => {
    if (!apiEndpoint) return

    // set alerts state to loading
    setAlertsIsLoading(true)
    alertsWorker.then(({ createWorker, stopWorker }) => {
      const worker = createWorker()
      // initial config
      worker.postMessage({
        action: "ALERTS_CONFIGURE",
        fetchVars: {
          apiEndpoint,
          options: {},
        },
        debug: true,
      })
    })

    setSilencesIsLoading(true)
    silencesWorker.then(({ createWorker, stopWorker }) => {
      const worker = createWorker()
      // initial config
      worker.postMessage({
        action: "SILENCES_CONFIGURE",
        apiEndpoint: apiEndpoint,
      })
    })
  }, [apiEndpoint])

  // enable/disable watching in the workers
  useEffect(() => {
    if (isUserActive === undefined) return
    alertsWorker.then(({ createWorker, stopWorker }) => {
      const worker = createWorker()
      worker.postMessage({
        action: "ALERTS_CONFIGURE",
        watch: isUserActive,
      })
    })
    silencesWorker.then(({ createWorker, stopWorker }) => {
      const worker = createWorker()
      worker.postMessage({
        action: "SILENCES_CONFIGURE",
        watch: isUserActive,
      })
    })
  }, [isUserActive])

  // as soon as we have locally some silences we refetch the them
  useEffect(() => {
    if (!useSilencesLocalItems || useSilencesLocalItems?.length <= 0) return
    silencesWorker.then(({ createWorker, stopWorker }) => {
      const worker = createWorker()
      worker.postMessage({
        action: "SILENCES_FETCH",
      })
    })
  }, [useSilencesLocalItems])
}

export default useAlertmanagerAPI
