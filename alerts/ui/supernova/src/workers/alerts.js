/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import ApiService from "../api/apiService"
import { get } from "../api/client"
import { sortAlerts, countAlerts } from "../lib/utils"

let compareAlertString

/**
 * @param {string} endpoint
 * @param {object} options
 * @returns {function} fetch function
 */
const fetchAction = (endpoint, options = {}) => {
  return get(`${endpoint}/alerts`, { params: options.params }).then((items) => {
    // sort alerts
    let alerts = sortAlerts(items)

    // copy additional filter options to labels for easier filter selection
    // because the alert object is nested this makes it a lot easier to filter, since we only use what is present in alert.labels
    alerts.forEach((alert) => {
      if (alert.labels) {
        alert.labels.status = alert.status?.state
      }
    })

    // slice if limit provided
    if (options?.limit) {
      if (options?.debug)
        console.info("Alerts service: limit set: ", options?.limit)
      alerts = alerts.slice(0, options?.limit)
    }

    // check if new loaded alerts are different from the last response
    const newCompareString = JSON.stringify(alerts)
    if (options?.debug)
      console.info(
        "Alerts service: any changes?",
        compareAlertString !== newCompareString
      )
    if (compareAlertString !== newCompareString) {
      compareAlertString = newCompareString

      if (options?.debug) console.info("Alerts service: inform listener")
      // inform listener to receive new alerts
      self.postMessage({
        action: "ALERTS_UPDATE",
        alerts,
        counts: countAlerts(alerts),
      })
    } else {
      if (options?.debug) console.info("Alerts service: no change found")
    }
  })
}

const alertsService = new ApiService({
  serviceName: "alerts",
  debug: true,
  onFetchStart: () => self.postMessage({ action: "ALERTS_FETCH_START" }),
  onFetchEnd: () => self.postMessage({ action: "ALERTS_FETCH_END" }),
  onFetchError: (error) => {
    self.postMessage({ action: "ALERTS_FETCH_ERROR", error: error.message })
  },
})

self.onmessage = (e) => {
  const action = e.data.action

  switch (action) {
    case "ALERTS_CONFIGURE":
      // require at least apiEndpoint to update the fetch method
      if (e.data?.fetchVars?.apiEndpoint) {
        // update the fetch function
        e.data["fetchFn"] = () =>
          fetchAction(
            e.data?.fetchVars.apiEndpoint,
            e.data?.fetchVars.options || {}
          )
      }
      alertsService.configure(e.data)
      break
    case "ALERTS_FETCH":
      alertService.fetch()
      break
  }
}
