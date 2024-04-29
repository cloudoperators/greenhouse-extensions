/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react"
import { registerConsumer } from "url-state-provider"
import { useActions, useActiveTab } from "../components/StoreProvider"

const DEFAULT_KEY = "heureka"
const ACTIVE_TAB = "t"

const useUrlState = (key) => {
  const [isURLRead, setIsURLRead] = useState(false)
  // it is possible to have two apps instances on the same page
  // int his case the key should be different per app
  const urlStateManager = registerConsumer(key || DEFAULT_KEY)

  const { setActiveTab } = useActions()
  const activeTab = useActiveTab()

  // Set initial state from URL (on login)
  useEffect(() => {
    if (isURLRead) return
    console.log(
      `HEUREKA: (${key || DEFAULT_KEY}) setting up state from url:`,
      urlStateManager.currentState()
    )

    // READ the url state and set the state
    const newTabIndex = urlStateManager.currentState()?.[ACTIVE_TAB]
    // SAVE the state
    if (newTabIndex) setActiveTab(newTabIndex)
    setIsURLRead(true)
  }, [isURLRead])

  // SYNC states to URL state
  useEffect(() => {
    if (!isURLRead) return
    urlStateManager.push({
      [ACTIVE_TAB]: activeTab,
    })
  }, [isURLRead, activeTab])
}

export default useUrlState
