import React, { useEffect } from "react"
import { useActions, Messages } from "messages-provider"
import { Container, Spinner, Stack } from "juno-ui-components"
import {
  useAlertsError,
  useAlertsIsLoading,
  useAlertsIsUpdating,
  useAlertsUpdatedAt,
  useAlertsTotalCounts,
  useAuthLoggedIn,
  useAuthError,
  useSilencesError,
} from "./hooks/useAppStore"
import AlertsList from "./components/alerts/AlertsList"
import RegionsList from "./components/regions/RegionsList"
import StatusBar from "./components/status/StatusBar"
import Filters from "./components/filters/Filters"
import WelcomeView from "./components/WelcomeView"
import { parseError } from "./helpers"
import AlertDetail from "./components/alerts/AlertDetail"
import PredefinedFilters from "./components/filters/PredefinedFilters"

const AppContent = (props) => {
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

  return (
    <Container px py className="h-full">
      <Messages className="pb-6" />
      {loggedIn && !authError ? (
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
      ) : (
        <WelcomeView />
      )}
    </Container>
  )
}

export default AppContent
