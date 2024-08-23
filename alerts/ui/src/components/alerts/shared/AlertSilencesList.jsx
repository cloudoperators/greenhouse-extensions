/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react"
import { DateTime } from "luxon"
import constants from "../../../constants"
import ExpireSilence from "../../silences/ExpireSilence"
import RecreateSilence from "../../silences/RecreateSilence"

import {
  Badge,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
} from "@cloudoperators/juno-ui-components"

import {
  useSilencesActions,
  useSilencesLocalItems,
} from "../../../hooks/useAppStore"

const badgeVariant = (state) => {
  switch (state) {
    case constants.SILENCE_STATE_ACTIVE:
      return "info"
    case constants.SILENCE_CREATING:
      return "warning"
    default:
      return "default"
  }
}

const AlertSilencesList = ({ alert }) => {
  const dateFormat = { ...DateTime.DATETIME_SHORT }
  const timeFormat = { ...DateTime.TIME_24_WITH_SHORT_OFFSET }
  const localItems = useSilencesLocalItems()

  const { getSilencesForAlert } = useSilencesActions()
  let silenceList = getSilencesForAlert(alert)

  const formatDateTime = (timestamp) => {
    const time = DateTime.fromISO(timestamp)
    return time.toLocaleString(dateFormat)
  }

  useEffect(() => {
    silenceList = getSilencesForAlert(alert)
  }, [localItems])

  // const activeSilences = getMappingSilences(alert)
  // const expiredSilences = getExpiredSilences(alert)
  // const silenceList = activeSilences.concat(
  //   expiredSilences,
  //   creatingExpiringSilences
  // )

  return (
    <>
      {silenceList.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-2 mt-8">Silences</h2>
          <DataGrid columns={6} minContentColumns={[5]}>
            <DataGridRow>
              <DataGridHeadCell>Status</DataGridHeadCell>
              <DataGridHeadCell>Silence start</DataGridHeadCell>
              <DataGridHeadCell>Silence end</DataGridHeadCell>
              <DataGridHeadCell>Created by</DataGridHeadCell>
              <DataGridHeadCell>Comment</DataGridHeadCell>
              <DataGridHeadCell>Action</DataGridHeadCell>
            </DataGridRow>
            {silenceList.map((silence) => (
              <DataGridRow key={silence.id}>
                <DataGridCell>
                  <div>
                    <Badge variant={badgeVariant(silence?.status?.state)}>
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
                <DataGridCell>
                  {
                    /// show the expire button if the silence is active or pending
                    // else show recreate button
                    silence?.status?.state === constants.SILENCE_ACTIVE ||
                    silence?.status?.state === constants.SILENCE_PENDING ||
                    silence?.status?.state === constants.SILENCE_CREATING ? (
                      <ExpireSilence
                        silence={silence}
                        fingerprint={alert.fingerprint}
                      />
                    ) : (
                      <RecreateSilence
                        silence={silence}
                        fingerprint={alert.fingerprint}
                      />
                    )
                  }
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
