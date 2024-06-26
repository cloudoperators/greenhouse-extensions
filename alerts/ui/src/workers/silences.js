/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import ApiService from "../api/apiService"
import { get } from "../api/client"
import { sortSilencesByState } from "../lib/utils"

export const fetchAction = (endpoint) => {
  return get(`${endpoint}/silences`, {}).then((items) => {
    // convert items to hash to easear access
    const itemsHash = items.reduce((itemsHash, silence) => {
      itemsHash[silence.id] = silence
      return itemsHash
    }, {})

    // split items by state (active, pending and expired)
    // https://github.com/prometheus/alertmanager/blob/main/types/types.go#L434
    const itemsByState = sortSilencesByState(items)
    self.postMessage({
      action: "SILENCES_UPDATE",
      silences: items,
      silencesHash: itemsHash,
      silencesBySate: itemsByState,
    })
  })
}

const silenceService = new ApiService({
  serviceName: "silences",
  debug: true,
  onFetchStart: () => self.postMessage({ action: "SILENCES_FETCH_START" }),
  onFetchEnd: () => self.postMessage({ action: "SILENCES_FETCH_END" }),
  onFetchError: (error) => {
    self.postMessage({ action: "SILENCES_FETCH_ERROR", error: error.message })
  },
})

self.onmessage = (e) => {
  const action = e.data.action

  switch (action) {
    case "SILENCES_CONFIGURE":
      if (e.data?.apiEndpoint) {
        e.data["fetchFn"] = () => fetchAction(e.data?.apiEndpoint)
      }
      silenceService.configure(e.data)
      break
    case "SILENCES_FETCH":
      silenceService.fetch()
      break
  }
}
