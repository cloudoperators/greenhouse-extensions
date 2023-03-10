import React, { useMemo } from "react"
import { Container, Message, Spinner, Stack } from "juno-ui-components"
import useStore from "./hooks/useStore"
import AlertsList from "./components/alerts/AlertsList"

const AppContent = (props) => {
  const alerts = useStore((state) => state.alerts)

  const { totalCount, criticalCount, warningCount, infoCount } = useMemo(() => {
    if (!alerts?.items)
      return { totalCount: 0, criticalCount: 0, warningCount: 0, infoCount: 0 }
    let totalCount = alerts.items.length
    let criticalCount = alerts.items.reduce(
      (critical, item) =>
        item.labels?.severity === "critical" ? ++critical : critical,
      0
    )
    let warningCount = alerts.items.reduce(
      (warning, item) =>
        item.labels?.severity === "warning" ? ++warning : warning,
      0
    )
    let infoCount = alerts.items.reduce(
      (info, item) => (item.labels?.severity === "info" ? ++info : info),
      0
    )

    return { totalCount, criticalCount, warningCount, infoCount }
  }, [alerts.items])

  return (
    <Container px py className="h-full">
      {alerts.error && (
        <Message variant="danger" className="mb-4">
          {`${alerts.error?.statusCode}, ${alerts.error?.message}`}
        </Message>
      )}

      {/* Add a toolbar  */}
      {alerts.items && !alerts.isLoading && (
        <div className="bg-theme-background-lvl-2 py-1.5 px-4">
          <span className="text-theme-high pr-2">{`${totalCount} alerts`}</span>
          <span>{`(${criticalCount} critical, ${warningCount} warning, ${infoCount} info)`}</span>
          {alerts.isUpdating && <span> Updating...</span>}
          <span className="float-right">
            {alerts.isUpdating
              ? "updating..."
              : `updated at ${new Date(alerts.updatedAt).toLocaleString(
                  "en-US"
                )}`}
          </span>
        </div>
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
