import { get } from "./client"

const sort = (items) => {
  return items.sort((a, b) => {
    if (
      (a.labels?.severity === "critical" &&
        b.labels?.severity !== "critical") ||
      (a.labels?.severity === "warning" &&
        ["critical", "warning"].indexOf(b.labels?.severity) < 0)
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

const DEFAULT_INTERVAL = 300000

function AlertsService(initialConfig) {
  let initialFetchPerformed = false

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

  const allowedOptions = Object.keys(config)
  let watchTimer
  let compareString

  const update = () => {
    console.log("===update", config)
    if (!config?.apiEndpoint || !config?.onChange) {
      console.warn("Alerts service: missing apiEndpoint or onChange callback")
      return
    }
    console.log("Alerts service: fetch alerts")
    if (config.onFetch) config.onFetch()
    return get(`${config.apiEndpoint}/alerts`, { params: config.params }).then(
      (items) => {
        initialFetchPerformed = true

        let alerts = sort(items)
        if (config?.limit) alerts = alerts.slice(0, config.limit)

        const newCompareString = JSON.stringify(alerts)
        if (compareString !== newCompareString) {
          compareString = newCompareString
          config?.onChange({ alerts })
        }
      }
    )
  }

  const updateWatcher = (oldConfig) => {
    if (
      oldConfig.watch === config.watch &&
      oldConfig.watchInterval === config.watchInterval
    )
      return
    clearInterval(watchTimer)

    console.log("Alerts service: update watcher", config)
    watchTimer = setInterval(update, config.watchInterval || DEFAULT_INTERVAL)
  }

  this.configure = (newOptions) => {
    const oldConfig = { ...config }
    config = { ...config, ...newOptions }

    Object.keys(config).forEach(
      (key) => allowedOptions.indexOf(key) < 0 && delete config[key]
    )

    console.log("Alerts service: new config", config)

    updateWatcher(oldConfig)
    if (config.initialFetch) update()
  }

  this.configure(initialConfig)
}

export default AlertsService
