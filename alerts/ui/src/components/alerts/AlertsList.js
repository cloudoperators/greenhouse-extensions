import React, { useMemo } from "react"
import { DataGrid, DataGridHeadCell, DataGridRow, Icon } from "juno-ui-components"
import { queryAlerts } from "../../queries"
import Alert from "./Alert"

const AlertsList = () => {

  const sortAlerts = (items) => {
    return items.sort((a,b) => {
      if((a.labels?.severity==='critical' && b.labels?.severity!=='critical') || 
        (a.labels?.severity==='warning' && ['critical','warning'].indexOf(b.labels?.severity) < 0)) return -1  
      else if((a.labels?.severity===b.labels?.severity) && (a.status?.state !== b.status?.state) && a.status?.state)  return a.status?.state.localeCompare(b.status?.state)
      else if((a.labels?.severity===b.labels?.severity) && (a.status?.state === b.status?.state) && (a.startsAt !== b.startsAt) && b.startsAt)  return b.startsAt?.localeCompare(a.startsAt)
      else if((a.labels?.severity===b.labels?.severity) && (a.status?.state === b.status?.state) && (a.startsAt === b.startsAt) && a.labels?.region) return a.labels?.region?.localeCompare(b.labels?.region)
      else return 1
    })
  }

  const { isLoading, isError, data, error } = queryAlerts()

  // TODO: the sorting should probably not happen here but in the query action
  const alertsSorted = useMemo(() => {
    if (data) {
      return sortAlerts(data)
    } 
  }, [data])


  return (
    <DataGrid columns={7} minContentColumns={[0,2,5]}>
      {!isLoading && 
        <DataGridRow>
          <DataGridHeadCell><Icon icon="danger" /></DataGridHeadCell>
          <DataGridHeadCell>Region</DataGridHeadCell>
          <DataGridHeadCell>Service</DataGridHeadCell>
          <DataGridHeadCell>Description</DataGridHeadCell>
          <DataGridHeadCell>Firing Since</DataGridHeadCell>
          <DataGridHeadCell>Status</DataGridHeadCell>
          <DataGridHeadCell></DataGridHeadCell>
        </DataGridRow>
      }
      {alertsSorted?.map(alert =>
        <Alert key={alert.fingerprint} alert={alert} />
      )}
    </DataGrid>
  )
}

export default AlertsList