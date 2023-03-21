import React from "react"
import { DateTime } from "luxon"

import { Container, Message, Spinner, Stack } from "juno-ui-components"
import useStore from "./hooks/useStore"
import AlertsList from "./components/alerts/AlertsList"
import RegionsList from "./components/regions/RegionsList"

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
        <Stack className="bg-theme-background-lvl-2 py-1.5 px-4 text-theme-light" alignment="center">
          <div>
            <span className="text-theme-default pr-2">{`${alerts.totalCounts.total} alerts`}</span>
            <span>{`(${alerts.totalCounts.critical} critical, ${alerts.totalCounts.warning} warning, ${alerts.totalCounts.info} info)`}</span>
          </div>
          <Stack alignment="center" className="ml-auto">
            {alerts.isUpdating &&
              <Spinner size="small" className="mr-2" />
            }
            {alerts.updatedAt &&
              `updated ${DateTime.fromMillis(alerts.updatedAt).toLocaleString({...DateTime.TIME_24_WITH_SHORT_OFFSET})}`
            }
          </Stack>
        </Stack>
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
