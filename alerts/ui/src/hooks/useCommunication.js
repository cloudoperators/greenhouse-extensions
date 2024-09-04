/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react"
import { get, watch } from "@cloudoperators/juno-communicator"
import { useUserActivityActions, useAuthActions } from "./useAppStore"

const useCommunication = () => {
  console.log("[supernova] useCommunication setup")
  const { setIsActive } = useUserActivityActions()
  const { setData: authSetData, setAppLoaded: authSetAppLoaded } =
    useAuthActions()

  useEffect(() => {
    // watch for user activity updates messages
    // with the watcher we get the user activity object when this app is loaded before the Auth app
    const unwatch = watch(
      "USER_ACTIVITY_UPDATE_DATA",
      (data) => {
        console.log("got message USER_ACTIVITY_UPDATE_DATA: ", data)
        setIsActive(data?.isActive)
      },
      { debug: true }
    )
    return unwatch
  }, [setIsActive])

  useEffect(() => {
    if (!authSetData || !authSetAppLoaded) return

    get("AUTH_APP_LOADED", authSetAppLoaded)
    const unwatchLoaded = watch("AUTH_APP_LOADED", authSetAppLoaded)

    get("AUTH_GET_DATA", authSetData)
    const unwatchUpdate = watch("AUTH_UPDATE_DATA", authSetData)

    return () => {
      if (unwatchLoaded) unwatchLoaded()
      if (unwatchUpdate) unwatchUpdate()
    }
  }, [authSetData, authSetAppLoaded])
}

export default useCommunication
