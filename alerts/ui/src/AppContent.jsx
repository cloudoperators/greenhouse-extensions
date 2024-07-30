/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react"
import { useActions, Messages } from "messages-provider"
import { Container, Spinner, Stack } from "@cloudoperators/juno-ui-components"
import {
  useAlertsError,
  useAlertsIsLoading,
  useAlertsIsUpdating,
  useAlertsUpdatedAt,
  useAlertsTotalCounts,
  useSilencesIsLoading,
  useAuthLoggedIn,
  useAuthError,
  useSilencesError,
  useGlobalsActions,
  useGlobalsActiveSelectedTab,
} from "./hooks/useAppStore"
import AlertsList from "./components/alerts/AlertsList"
import RegionsList from "./components/regions/RegionsList"
import StatusBar from "./components/status/StatusBar"
import Filters from "./components/filters/Filters"
import WelcomeView from "./components/WelcomeView"
import { parseError } from "./helpers"
import AlertDetail from "./components/alerts/AlertDetail"
import PredefinedFilters from "./components/filters/PredefinedFilters"
import SilencesList from "./components/silences/SilencesList"

const AppContent = () => {
  const { addMessage } = useActions()
  const loggedIn = useAuthLoggedIn()
  const authError = useAuthError()

  // alerts
  const alertsError = useAlertsError()
  const isAlertsLoading = useAlertsIsLoading()
  const totalCounts = useAlertsTotalCounts()
  const isAlertsUpdating = useAlertsIsUpdating()
  const updatedAt = useAlertsUpdatedAt()

  // silences
  const silencesError = useSilencesError()
  const isSilencesLoading = useSilencesIsLoading()

  const { setActiveSelectedTab } = useGlobalsActions()
  const activeSelectedTab = useGlobalsActiveSelectedTab()

  useEffect(() => {
    if (!authError) return
    addMessage({
      variant: "error",
      text: parseError(authError),
    })
  }, [authError])

  useEffect(() => {
    // since the API call is done in a web worker and not logging aware, we need to show the error just in case the user is logged in
    if (!alertsError || !loggedIn) return

    // if user uses firefox warn to activate `allow_client_cert`. Should be enough to do it just here since the API call is done in a web worker and nothing else will be loaded until the alerts are loaded
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox")
    if (isFirefox) {
      addMessage({
        variant: "warning",
        text: (
          <p>
            Firefox detected. Please ensure that you have activated{" "}
            <b>allow_client_cert</b> to enable the retrieval of alerts and
            silences from the API.
            <ul>
              <li>1. Go to about:config (via address bar)</li>
              <li>
                2. Change <b>network.cors_preflight.allow_client_cert</b> to{" "}
                <b>true</b>
              </li>
              <li>3. Reload Greenhouse</li>
            </ul>
          </p>
        ),
      })
    }

    addMessage({
      variant: "error",
      text: parseError(alertsError),
    })
  }, [alertsError, loggedIn])

  useEffect(() => {
    // since the API call is done in a web worker and not logging aware, we need to show the error just in case the user is logged in
    if (!silencesError || !loggedIn) return
    addMessage({
      variant: "error",
      text: parseError(silencesError),
    })
  }, [silencesError, loggedIn])

  const handleTabSelect = (item) => {
    setActiveSelectedTab(item)
  }

  return (
    <Container px py className="h-full">
      <Messages className="pb-6" />
      {loggedIn && !authError ? (
        <>
          {activeSelectedTab === "alerts" && (
            <>
              <AlertDetail />
              <RegionsList />
              {isAlertsLoading ? (
                <Stack gap="2">
                  <span>Loading</span>
                  <Spinner variant="primary" />
                </Stack>
              ) : (
                <>
                  <PredefinedFilters />
                  <Filters />
                  <StatusBar
                    totalCounts={totalCounts}
                    isUpdating={isAlertsUpdating}
                    updatedAt={updatedAt}
                  />
                  <AlertsList />
                </>
              )}
            </>
          )}
          {activeSelectedTab === "silences" && (
            <>
              {isSilencesLoading ? (
                <Stack gap="2">
                  <span>Loading</span>
                  <Spinner variant="primary" />
                </Stack>
              ) : (
                <SilencesList />
              )}
            </>
          )}
        </>
      ) : (
        <WelcomeView />
      )}
    </Container>
  )
}

export default AppContent
