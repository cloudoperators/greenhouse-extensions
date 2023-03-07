import React, { useMemo, useState } from "react"
import {
  DataGrid,
  DataGridHeadCell,
  DataGridRow,
  Icon,
} from "juno-ui-components"
import Alert from "./Alert"
import useStore from "../../hooks/useStore"

const sortAlerts = (items) => {
  return items.sort((a, b) => {
    if (
      (a.labels?.severity === "critical" &&
        b.labels?.severity !== "critical") ||
      (a.labels?.severity === "warning" &&
        ["critical", "warning"].indexOf(b.labels?.severity) < 0)
    )
      return -1
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state !== b.status?.state &&
      a.status?.state
    )
      return a.status?.state.localeCompare(b.status?.state)
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state === b.status?.state &&
      a.startsAt !== b.startsAt &&
      b.startsAt
    )
      return b.startsAt?.localeCompare(a.startsAt)
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state === b.status?.state &&
      a.startsAt === b.startsAt &&
      a.labels?.region
    )
      return a.labels?.region?.localeCompare(b.labels?.region)
    else return 1
  })
}

const AlertsList = () => {
  // const { isLoading, isError, data, error } = queryAlerts()
  const alerts = useStore((state) => state.alerts)
  console.log("====", alerts)
  // TODO: the sorting should probably not happen here but in the query action
  const alertsSorted = useMemo(() => {
    if (alerts.items) {
      return sortAlerts(alerts.items)
    }
  }, [alerts.items])

  return (
    <DataGrid columns={7} minContentColumns={[0, 2, 5]}>
      {!alerts.isLoading && (
        <DataGridRow>
          <DataGridHeadCell>
            <Icon icon="danger" />
          </DataGridHeadCell>
          <DataGridHeadCell>Region</DataGridHeadCell>
          <DataGridHeadCell>Service</DataGridHeadCell>
          <DataGridHeadCell>Description</DataGridHeadCell>
          <DataGridHeadCell>Firing Since</DataGridHeadCell>
          <DataGridHeadCell>Status</DataGridHeadCell>
          <DataGridHeadCell></DataGridHeadCell>
        </DataGridRow>
      )}
      {alertsSorted?.map((alert) => (
        <Alert key={alert.fingerprint} alert={alert} />
      ))}
    </DataGrid>
  )
}

export default AlertsList
