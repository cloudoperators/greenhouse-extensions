/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useReducer, useEffect, useCallback } from "react"
import { broadcast, get, watch } from "communicator"
import useStore from "./useStore"

const useCommunication = () => {
  console.log("[heureka] useCommunication setup")

  const setAuth = useStore((state) => state.setAuth)
  const setLoggedIn = useStore((state) => state.setLoggedIn)
  const setLoggedOut = useStore((state) => state.setLoggedOut)
  const setLogin = useStore((state) => state.setLogin)

  useEffect(() => {
    // get manually the current auth object in case the this app mist the first auth update message
    // this is the case this app is loaded after the Auth app.
    get(
      "AUTH_GET_DATA",
      (data) => {
        setAuth(data.auth)
        setLoggedIn(data.loggedIn)
      },
      { debug: true }
    )
    // watch for auth updates messages
    // with the watcher we get the auth object when this app is loaded before the Auth app
    const unwatch = watch(
      "AUTH_UPDATE_DATA",
      (data) => {
        setAuth(data.auth)
        setLoggedIn(data.loggedIn)
      },
      { debug: true }
    )
    return unwatch
  }, [setAuth, setLoggedIn])

  setLogin(() => {
    broadcast("AUTH_LOGIN", "heureka", { debug: true })
  })

  setLoggedOut(() => {
    broadcast("AUTH_LOGOUT", "heureka")
  })
}

export default useCommunication
