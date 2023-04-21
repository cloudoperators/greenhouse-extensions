/**
 * This module implements a service to retrieve alerts from AlertManager.
 * @module alertsService
 */
import { get } from "./client"
import { countAlerts } from "../lib/utils"

/**
 * This method sorts the alerts first by severity (critical -> warning -> others), then by status, then by startsAt timestamp and finally by region
 * @param {array} items, a list of alerts
 * @returns {array} sorted alerts
 */
const sort = (items) => {
  const importantSeverities = ["critical", "warning"]

  return items.sort((a, b) => {
    if (
      (a.labels?.severity === "critical" &&
        b.labels?.severity !== "critical") ||
      (a.labels?.severity === "warning" &&
        importantSeverities.indexOf(b.labels?.severity) < 0)
    )
      return -1
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state !== b.status?.state &&
      a.status?.state
    )
      return a.status?.state.localeCompare(b.status?.state)
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state === b.status?.state &&
      a.startsAt !== b.startsAt &&
      b.startsAt
    )
      return b.startsAt?.localeCompare(a.startsAt)
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state === b.status?.state &&
      a.startsAt === b.startsAt &&
      a.labels?.region
    )
      return a.labels?.region?.localeCompare(b.labels?.region)
    else return 1
  })
}

// default value for watch interval
const DEFAULT_INTERVAL = 300000

/**
 * This function implements the actual service.
 * @param {object} initialConfig
 */
function AlertsService(initialConfig) {
  // default config
  let config = {
    debug: false,
    initialFetch: false,
    apiEndpoint: null,
    watch: true,
    watchInterval: DEFAULT_INTERVAL, // 5 min
    limit: null,
    onChange: null,
    onFetchStart: null,
    onFetchEnd: null,
    params: null,
  }

  let initialFetchPerformed = false

  // get the allowed config keys from default config
  const allowedOptions = Object.keys(config)
  // variable to hold the watch timer created by setInterval
  let watchTimer
  // cache a string representation of the last alerts list
  let compareString

  // This function performs the request to get all alerts
  const update = () => {
    // do nothing until apiEndpoint and onChange config values are set
    if (!config?.apiEndpoint || !config?.onChange) {
      if (config?.debug)
        console.warn("Alerts service: missing apiEndpoint or onChange callback")
      return
    }
    // call onFetchStart if defined
    // This is useful to inform the listener that a new fetch is starting
    if (config.onFetchStart) config.onFetchStart()

    if (config?.debug) console.info("Alerts service: start fetch")
    // get all alerts filtered by params if defined
    initialFetchPerformed = true
    return get(`${config.apiEndpoint}/alerts`, { params: config.params })
      .then((items) => {
        if (config?.debug) {
          console.info("Alerts service: receive items")
          console.info("Alerts service: sort items")
        }
        // sort alerts
        let alerts = sort(items)
        
        // copy additional filter options to labels for easier filter selection
        // because the alert object is nested this makes it a lot easier to filter, since we only use what is present in alert.labels
        console.info("Alerts service: copy additional filters to labels")
        alerts.forEach(alert => {
          if (alert.labels) {
            alert.labels.status = alert.status?.state
          }
          
        })

        if (config?.debug) console.info("Alerts service: limit items")
        // slice if limit provided
        if (config?.limit) alerts = alerts.slice(0, config.limit)

        // check if new loaded alerts are different from the last response
        const newCompareString = JSON.stringify(alerts)
        if (config?.debug)
          console.info(
            "Alerts service: any changes?",
            compareString !== newCompareString
          )
        if (compareString !== newCompareString) {
          compareString = newCompareString

          if (config?.debug) console.info("Alerts service: inform listener")
          // inform listener to receive new alerts
          config?.onChange({ alerts, counts: countAlerts(alerts) })
        } else {
          if (config?.debug) console.info("Alerts service: no change found")
        }
        if (config.onFetchEnd) config.onFetchEnd()
      })
      .catch((error) => console.warn("Alerts service:", error))
  }

  // update watcher if config has changed
  const updateWatcher = (oldConfig) => {
    // do nothing if watch and watchInterval are the same
    if (
      initialFetchPerformed &&
      oldConfig.watch === config.watch &&
      oldConfig.watchInterval === config.watchInterval
    )
      return

    // delete last watcher
    clearInterval(watchTimer)

    // create a new watcher which calls the update method
    if (config.watch) {
      watchTimer = setInterval(update, config.watchInterval || DEFAULT_INTERVAL)
    }
  }

  // this function is public and used to update the config
  this.configure = (newOptions) => {
    const oldConfig = { ...config }
    config = { ...config, ...newOptions }

    Object.keys(config).forEach(
      (key) => allowedOptions.indexOf(key) < 0 && delete config[key]
    )

    if (config?.debug) console.log("Alerts service: new config", config)

    updateWatcher(oldConfig)
    if (config.initialFetch && !initialFetchPerformed) update()
  }

  // make it possible to update alerts explicitly, not by a watcher!
  this.fetch = update

  // update the config initially
  this.configure(initialConfig)
}

export default AlertsService
