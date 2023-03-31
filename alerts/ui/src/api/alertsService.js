/**
 * This module implements a service to retrieve alerts from AlertManager.
 * @module alertsService
 */
import { get } from "./client"

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

// count alerts and create a map
// {
//   global: { total: number, critical: number, ...},
//   regions: {
//     "eu-de-1": { total: number, critical: {total: number, suppressed: number}, warning: {...}, ...}
//   }, ...
// }
const count = (alerts) => {
  const counts = { global: { total: 0 }, regions: {} }

  if (!alerts || alerts.length === 0) return counts
  alerts.forEach((alert) => {
    // total number of alerts
    counts.global.total += 1
    
    const region = alert.labels?.region
    const severity = alert.labels?.severity
    const state = alert.status?.state

    // global count per severity
    counts.global[severity] = counts.global[severity] || 0 // init
    counts.global[severity] += 1

    // count per region and severity
    counts.regions[region] = counts.regions[region] || {} // init
    counts.regions[region].total = counts.regions[region].total || 0 // init
    counts.regions[region].total += 1

    // total count per severity
    counts.regions[region][severity] = counts.regions[region][severity] || {} // init
    counts.regions[region][severity]["total"] = counts.regions[region][severity]?.total || 0 // init
    counts.regions[region][severity]["total"] += 1
    // suppressed per severity
    if (state === "suppressed" ) {
      counts.regions[region][severity].suppressed = counts.regions[region][severity]?.suppressed || 0 // init
      counts.regions[region][severity].suppressed += 1
    }

  })
  // TODO: sort by region name
  // const countsRegionsSorted = [
  //   ...new Map(
  //     counts.regions.map((region) => [region, item.labels?.region]).sort()
  //   ).keys(),
  // ]

  return counts
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
      console.warn("Alerts service: missing apiEndpoint or onChange callback")
      return
    }
    // call onFetchStart if defined
    // This is useful to inform the listener that a new fetch is starting
    if (config.onFetchStart) config.onFetchStart()

    console.info("Alerts service: start fetch")
    // get all alerts filtered by params if defined
    initialFetchPerformed = true
    return get(`${config.apiEndpoint}/alerts`, { params: config.params })
      .then((items) => {
        console.info("Alerts service: receive items")
        console.info("Alerts service: sort items")
        // normalize some label values, like for example status.state to lower case
        // sort alerts
        let alerts = sort(items)
        console.info("Alerts service: limit items")
        // slice if limit provided
        if (config?.limit) alerts = alerts.slice(0, config.limit)

        // check if new loaded alerts are different from the last response
        const newCompareString = JSON.stringify(alerts)
        console.info(
          "Alerts service: any changes?",
          compareString !== newCompareString
        )
        if (compareString !== newCompareString) {
          compareString = newCompareString

          console.info("Alerts service: inform listener")
          // inform listener to receive new alerts
          config?.onChange({ alerts, counts: count(alerts) })
        } else {
          console.info("Alerts service: no change found")
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

    console.log("Alerts service: new config", config)

    updateWatcher(oldConfig)
    if (config.initialFetch && !initialFetchPerformed) update()
  }

  // make it possible to update alerts explicitly, not by a watcher!
  this.fetch = update

  // update the config initially
  this.configure(initialConfig)
}

export default AlertsService
