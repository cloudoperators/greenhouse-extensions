import React from "react"
import { DateTime } from "luxon"

import {
  Badge,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
} from "juno-ui-components"

import { useSilencesActions } from "../../../hooks/useAppStore"

const AlertSilencesList = ({ alert }) => {
  const dateFormat = { ...DateTime.DATETIME_SHORT }
  const timeFormat = { ...DateTime.TIME_24_WITH_SHORT_OFFSET }

  const formatDateTime = (timestamp) => {
    const time = DateTime.fromISO(timestamp)
    return time.toLocaleString(dateFormat)
  }

  const { getMappingSilences, getExpiredSilences } = useSilencesActions()

  const activeSilences = getMappingSilences(alert)
  const expiredSilences = getExpiredSilences(alert)
  const silenceList = activeSilences.concat(expiredSilences)

  return (
    <>
      {silenceList.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-2 mt-8">Silences</h2>
          <DataGrid columns={5}>
            <DataGridRow>
              <DataGridHeadCell>Status</DataGridHeadCell>
              <DataGridHeadCell>Silence start</DataGridHeadCell>
              <DataGridHeadCell>Silence end</DataGridHeadCell>
              <DataGridHeadCell>Created by</DataGridHeadCell>
              <DataGridHeadCell>Comment</DataGridHeadCell>
            </DataGridRow>
            {silenceList.map((silence) => (
              <DataGridRow key={silence.id}>
                <DataGridCell>
                  <div>
                    <Badge
                      variant={
                        silence.status?.state === "active" ? "info" : "default"
                      }
                    >
                      {silence.status?.state}
                    </Badge>
                  </div>
                </DataGridCell>
                <DataGridCell>{formatDateTime(silence.startsAt)}</DataGridCell>
                <DataGridCell>{formatDateTime(silence.endsAt)}</DataGridCell>
                <DataGridCell>{silence.createdBy}</DataGridCell>
                <DataGridCell className="break-all">
                  {silence.comment}
                </DataGridCell>
              </DataGridRow>
            ))}
          </DataGrid>
        </>
      )}
    </>
  )
}

export default AlertSilencesList
