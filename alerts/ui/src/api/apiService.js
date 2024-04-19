/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
    serviceName: null,
    initialFetch: true, // Set this to false to disable this service from automatically running.
    fetchFn: null, // The promise function that the service will use to request data
    watch: true, // if true runs the fetchFn periodically with an interval defined in watchInterval
    watchInterval: DEFAULT_INTERVAL, // 5 min
    onFetchStart: null,
    onFetchEnd: null,
    onFetchError: null,
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
      // call onFetchStart if defined
      // This is useful to inform the listener that a new fetch is starting
      if (config.onFetchStart) config.onFetchStart()
      if (config?.debug)
        console.info(`ApiService::${config.serviceName || ""}: start fetch`)
      initialFetchPerformed = true
      return config
        .fetchFn()
        .then(() => {
          if (config.onFetchEnd) config.onFetchEnd()
        })
        .catch((error) => {
          console.warn(`ApiService::${config.serviceName || ""}:`, error)
          if (config.onFetchError) config.onFetchError(error)
        })
    } else {
      if (config?.debug)
        console.warn(
          `ApiService::${config.serviceName || ""}: missing fetch function`
        )
      return
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
    // update apiService config
    config = { ...config, ...newOptions }

    // check for allowed keys
    Object.keys(config).forEach(
      (key) => allowedOptions.indexOf(key) < 0 && delete config[key]
    )

    if (config?.debug)
      console.log(
        `ApiService::${config.serviceName || ""}: new config: `,
        config
      )

    // update watcher will check the config relevant attribute changed to update the watcher
    updateWatcher(oldConfig)
    if (config.initialFetch && !initialFetchPerformed) update()
  }

  // make it possible to update explicitly, not by a watcher!
  this.fetch = update

  // set the config initially
  this.configure(initialConfig)
}

export default ApiService
