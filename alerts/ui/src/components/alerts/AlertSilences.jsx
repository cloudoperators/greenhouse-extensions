/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { DateTime } from "luxon"

import {
  Button,
  Container,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
} from "juno-ui-components"

import { useAlertsActions, useGlobalsActions } from "../../hooks/useAppStore"
import AlertDescription from "./shared/AlertDescription"
import AlertSilencesList from "./shared/AlertSilencesList"

const AlertSilences = ({ alert }) => {
  const { getAlertByFingerprint } = useAlertsActions()
  const { setShowDetailsFor } = useGlobalsActions()

  // comment
  // createdBy
  // endsAt
  // id
  // matchers
  // startsAt
  // status.state
  // updatedAt

  return (
    <Container py px={false}>
      <AlertSilencesList alert={alert} />

      {alert.status.inhibitedBy.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-2 mt-8">Inhibited by</h2>
          <DataGrid columns={2}>
            <DataGridRow>
              <DataGridHeadCell>Alert</DataGridHeadCell>
              <DataGridHeadCell></DataGridHeadCell>
            </DataGridRow>
            {alert.status.inhibitedBy.map((fingerprint) => (
              <DataGridRow key={fingerprint}>
                <DataGridCell>
                  <div>
                    {getAlertByFingerprint(fingerprint)?.annotations?.summary}
                  </div>
                  <AlertDescription
                    description={
                      getAlertByFingerprint(fingerprint)?.annotations
                        ?.description
                    }
                  />
                </DataGridCell>
                <DataGridCell>
                  <Button
                    size="small"
                    onClick={() => setShowDetailsFor(fingerprint)}
                    icon="exitToApp"
                  >
                    Go to details
                  </Button>
                </DataGridCell>
              </DataGridRow>
            ))}
          </DataGrid>
        </>
      )}
    </Container>
  )
}

export default AlertSilences
