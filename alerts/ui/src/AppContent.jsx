import React from "react"
import { DateTime } from "luxon"

import { Container, Message, Spinner, Stack } from "juno-ui-components"
import useStore from "./hooks/useStore"
import AlertsList from "./components/alerts/AlertsList"
import RegionsList from "./components/regions/RegionsList"
import StatusBar from "./components/status/StatusBar"

const AppContent = (props) => {
  const alerts = useStore((state) => state.alerts)


  return (
    <Container px py className="h-full">
      {alerts.error && (
        <Message variant="danger" className="mb-4">
          {`${alerts.error?.statusCode}, ${alerts.error?.message}`}
        </Message>
      )}

      <RegionsList />
      
      {alerts.items && !alerts.isLoading && (
        <StatusBar totalCounts={alerts.totalCounts} isUpdating={alerts.isUpdating} updatedAt={alerts.updatedAt} />
      )}

      {alerts.isLoading && (
        <Stack gap="2">
          <span>Loading</span>
          <Spinner variant="primary" />
        </Stack>
      )}

      <AlertsList />
      
    </Container>
  )
}

export default AppContent
