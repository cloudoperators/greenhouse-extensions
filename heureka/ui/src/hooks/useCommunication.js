/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react"
import { broadcast, get, watch } from "@cloudoperators/juno-communicator"
import {
  useUserActivityActions,
  useAuthAppLoaded,
  useAuthIsProcessing,
  useAuthError,
  useAuthLoggedIn,
  useAuthLastAction,
  useAuthActions,
} from "./useAppStore"
import { AUTH_ACTIONS } from "../lib/slices/createAuthDataSlice"

const useCommunication = () => {
  const { setIsActive } = useUserActivityActions()
  const authAppLoaded = useAuthAppLoaded()
  const authIsProcessing = useAuthIsProcessing()
  const authError = useAuthError()
  const authLoggedIn = useAuthLoggedIn()
  const authLastAction = useAuthLastAction()
  const { setData: authSetData, setAppLoaded: authSetAppLoaded } =
    useAuthActions()

  useEffect(() => {
    // watch for user activity updates messages
    // with the watcher we get the user activity object when this app is loaded before the Auth app
    const unwatch = watch(
      "USER_ACTIVITY_UPDATE_DATA",
      (data) => {
        setIsActive(data?.isActive)
      },
      { debug: true }
    )
    return unwatch
  }, [setIsActive])

  // allow heureka to login/logout the user. Visible when app is not in embedded mode
  useEffect(() => {
    if (!authAppLoaded || authIsProcessing || authError) return
    if (authLastAction?.name === AUTH_ACTIONS.SIGN_ON && !authLoggedIn) {
      broadcast("AUTH_LOGIN", "heureka", { debug: false })
    } else if (authLastAction?.name === AUTH_ACTIONS.SIGN_OUT && authLoggedIn) {
      broadcast("AUTH_LOGOUT", "heureka")
    }
  }, [authAppLoaded, authIsProcessing, authError, authLoggedIn, authLastAction])

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
