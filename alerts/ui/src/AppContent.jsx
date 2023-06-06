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
} from "./hooks/useStore"
import AlertsList from "./components/alerts/AlertsList"
import RegionsList from "./components/regions/RegionsList"
import StatusBar from "./components/status/StatusBar"
import Filters from "./components/filters/Filters"
import WelcomeView from "./components/WelcomeView"
import { parseError } from "./helpers"

const AppContent = (props) => {
  const { addMessage } = useActions()
  const loggedIn = useAuthLoggedIn()
  const authError = useAuthError()

  const alertsError = useAlertsError()
  const isAlertsLoading = useAlertsIsLoading()
  const totalCounts = useAlertsTotalCounts()
  const isAlertsUpdating = useAlertsIsUpdating()
  const updatedAt = useAlertsUpdatedAt()

  useEffect(() => {
    if (!authError) return
    addMessage({
      variant: "error",
      text: parseError(authError),
    })
  }, [authError])

  useEffect(() => {
    if (!alertsError) return
    addMessage({
      variant: "error",
      text: `${alertsError?.statusCode}, ${alertsError?.message}`,
    })
  }, [alertsError])

  return (
    <Container px py className="h-full">
      <Messages />
      {loggedIn && !authError ? (
        <>
          <RegionsList />

          {isAlertsLoading ? (
            <Stack gap="2">
              <span>Loading</span>
              <Spinner variant="primary" />
            </Stack>
          ) : (
            <>
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
