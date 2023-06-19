/**
 * This module implements a service to retrieve information from an API
 * @module apiService
 */

// default value for watch interval
const DEFAULT_INTERVAL = 300000

/**
 * This function implements the actual service.
 * @param {object} initialConfig
 */
function ApiService(initialConfig) {
  // default config
  let config = {
    initialFetch: true, // Set this to false to disable this service from automatically running.
    fetchFn: null, // The promise function that the service will use to request data
    watch: true, // if true runs the fetchFn periodically with an interval defined in watchInterval
    watchInterval: DEFAULT_INTERVAL, // 5 min
    onFetchStart: null,
    onFetchEnd: null,
    debug: false,
  }

  let initialFetchPerformed = false

  // get the allowed config keys from default config
  const allowedOptions = Object.keys(config)
  // variable to hold the watch timer created by setInterval
  let watchTimer

  // This function performs the request to get the target data
  const update = () => {
    if (config.fetchFn) {
      if (config.onFetchStart) config.onFetchStart()
      return config
        .fetchFn()
        .then(() => {
          if (config.onFetchEnd) config.onFetchEnd()
        })
        .catch((error) => console.warn("Service:", error))
    }
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

    // check for allowed keys
    Object.keys(config).forEach(
      (key) => allowedOptions.indexOf(key) < 0 && delete config[key]
    )

    if (config?.debug) console.log("[service worker]: new config", config)

    updateWatcher(oldConfig)
    if (config.initialFetch && !initialFetchPerformed) update()
  }

  // make it possible to update explicitly, not by a watcher!
  this.fetch = update

  // set the config initially
  this.configure(initialConfig)
}

export default ApiService
