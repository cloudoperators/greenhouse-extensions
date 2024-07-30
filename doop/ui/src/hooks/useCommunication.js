/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react"
import { broadcast, get, watch } from "@cloudoperators/juno-communicator"

import {
  useAuthAppLoaded,
  useAuthIsProcessing,
  useAuthError,
  useAuthLoggedIn,
  useAuthLastAction,
  useAuthActions,
  useUserActivityActions,
  ACTIONS,
} from "../components/StoreProvider"

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
        console.log("got message USER_ACTIVITY_UPDATE_DATA: ", data)
        setIsActive(data?.isActive)
      },
      { debug: true, consumerID: "doop" }
    )
    return unwatch
  }, [setIsActive])

  useEffect(() => {
    if (!authAppLoaded || authIsProcessing || authError) return
    if (authLastAction?.name === ACTIONS.SIGN_ON && !authLoggedIn) {
      broadcast("AUTH_LOGIN", "doop", { debug: false, consumerID: "doop" })
    } else if (authLastAction?.name === ACTIONS.SIGN_OUT && authLoggedIn) {
      broadcast("AUTH_LOGOUT", "doop", { consumerID: "doop", debug: false })
    }
  }, [authAppLoaded, authIsProcessing, authError, authLoggedIn, authLastAction])

  useEffect(() => {
    if (!authSetData || !authSetAppLoaded) return

    get("AUTH_APP_LOADED", authSetAppLoaded, {
      consumerID: "doop",
      debug: false,
    })
    const unwatchLoaded = watch("AUTH_APP_LOADED", authSetAppLoaded, {
      consumerID: "doop",
      debug: false,
    })

    get("AUTH_GET_DATA", authSetData, { consumerID: "doop", debug: false })
    const unwatchUpdate = watch("AUTH_UPDATE_DATA", authSetData, {
      consumerID: "doop",
      debug: false,
    })

    return () => {
      if (unwatchLoaded) unwatchLoaded()
      if (unwatchUpdate) unwatchUpdate()
    }
  }, [authSetData, authSetAppLoaded])
}

export default useCommunication
