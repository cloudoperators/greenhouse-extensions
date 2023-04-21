import React from "react"
import { DateTime } from "luxon"

import { Container, Message, Spinner, Stack } from "juno-ui-components"
import {
  useAlertsError,
  useAlertsIsLoading,
  useAlertsIsUpdating,
  useAlertsUpdatedAt,
  useAlertsTotalCounts,
} from "./hooks/useStore"
import AlertsList from "./components/alerts/AlertsList"
import RegionsList from "./components/regions/RegionsList"
import StatusBar from "./components/status/StatusBar"
import Filters from "./components/filters/Filters"

const AppContent = (props) => {
  const error = useAlertsError()
  const isLoading = useAlertsIsLoading()
  const totalCounts = useAlertsTotalCounts()
  const isUpdating = useAlertsIsUpdating()
  const updatedAt = useAlertsUpdatedAt()

  return (
    <Container px py className="h-full">
      {error && (
        <Message variant="danger" className="mb-4">
          {`${error?.statusCode}, ${error?.message}`}
        </Message>
      )}

      <RegionsList />

      {isLoading ? (
        <Stack gap="2">
          <span>Loading</span>
          <Spinner variant="primary" />
        </Stack>
      )
      : (
        <>
          <Filters />
          <StatusBar
            totalCounts={totalCounts}
            isUpdating={isUpdating}
            updatedAt={updatedAt}
          />
          <AlertsList />
        </>
      )}

    </Container>
  )
}

export default AppContent
