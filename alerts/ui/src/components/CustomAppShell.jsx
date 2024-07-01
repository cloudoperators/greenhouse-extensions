/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  AppShell,
  PageHeader,
  TopNavigation,
  TopNavigationItem,
} from "juno-ui-components"
import {
  useAuthData,
  useAuthLoggedIn,
  useGlobalsEmbedded,
  useAuthActions,
  useGlobalsActions,
  useGlobalsActiveSelectedTab,
} from "../hooks/useAppStore"
import HeaderUser from "./HeaderUser"

const CustomAppShell = ({ children }) => {
  const embedded = useGlobalsEmbedded()
  const authData = useAuthData()
  const loggedIn = useAuthLoggedIn()
  const { logout } = useAuthActions()
  const activeSelectedTab = useGlobalsActiveSelectedTab()
  const { setActiveSelectedTab } = useGlobalsActions()

  const pageHeader = useMemo(() => {
    return (
      <PageHeader heading="Converged Cloud | Supernova">
        {loggedIn && <HeaderUser auth={authData} logout={logout} />}
      </PageHeader>
    )
  }, [loggedIn, authData, logout])

  const handleTabSelect = (item) => {
    setActiveSelectedTab(item)
  }

  const topNavigation = (
    <TopNavigation
      activeItem={activeSelectedTab}
      onActiveItemChange={handleTabSelect}
    >
      <TopNavigationItem
        icon="danger"
        key="alerts"
        value="alerts"
        label="Alerts"
      />
      <TopNavigationItem
        icon="info"
        key="silences"
        value="silences"
        label="Silences"
      />
    </TopNavigation>
  )

  return (
    <AppShell
      pageHeader={pageHeader}
      embedded={embedded}
      topNavigation={topNavigation}
    >
      {children}
    </AppShell>
  )
}

export default CustomAppShell
