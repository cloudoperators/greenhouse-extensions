/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useCallback } from "react"
import { get, watch } from "@cloudoperators/juno-communicator"
import {
  useUserActivityActions,
  useAuthActions,
  useActiveFilters,
  useFilterActions,
  useFilterLabels,
} from "./useAppStore"

const useCommunication = () => {
  console.debug("[supernova] useCommunication setup")
  const { setIsActive } = useUserActivityActions()
  const { setData: authSetData } = useAuthActions()
  const activeFilters = useActiveFilters()
  const { setActiveFilters } = useFilterActions()
  const filterLabels = useFilterLabels()

  const setAuthData = useCallback(
    (data) => {
      if (!data) return

      // set the auth data
      authSetData(data)

      // The following code exists of historical reasons and should be refactored
      // We preset the support group filter based on auth data. This should be done
      // with predefined filters prop

      // check if support group filter is set in activeFilters
      // activeFilters example: {support_group: Array(1)}
      if (
        !activeFilters?.support_group &&
        data?.auth?.parsed?.supportGroups &&
        filterLabels?.includes("support_group")
      ) {
        setActiveFilters({ support_group: data.auth.parsed.supportGroups })
      }
    },
    [authSetData, filterLabels]
  )

  useEffect(() => {
    // watch for user activity updates messages
    // with the watcher we get the user activity object when this app is loaded before the Auth app
    const unwatch = watch(
      "USER_ACTIVITY_UPDATE_DATA",
      (data) => {
        console.debug("got message USER_ACTIVITY_UPDATE_DATA: ", data)
        setIsActive(data?.isActive)
      },
      { debug: true }
    )
    return unwatch
  }, [setIsActive])

  useEffect(() => {
    authSetData({ auth: { parsed: { fullName: "anonymous" } } })
    if (!setAuthData) return

    get("AUTH_GET_DATA", setAuthData)
    const unwatchUpdate = watch("AUTH_UPDATE_DATA", setAuthData)

    return () => {
      if (unwatchUpdate) unwatchUpdate()
    }
  }, [setAuthData])
}

export default useCommunication
