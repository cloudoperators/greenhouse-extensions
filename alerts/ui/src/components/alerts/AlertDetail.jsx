import React from "react"
import {
  DataGrid,
  DataGridRow,
  DataGridCell,
  Panel,
  DataGridHeadCell,
  PanelFooter,
  Stack,
  PanelBody,
  Spinner,
} from "juno-ui-components"
import {
  useShowDetailsFor,
  useGlobalsActions,
  useAlertsActions,
  useAlertsIsLoading,
} from "../../hooks/useStore"
import AlertIcon from "./shared/AlertIcon"
import AlertTimestamp from "./shared/AlertTimestamp"
import AlertDescription from "./shared/AlertDescription"
import AlertLinks from "./shared/AlertLinks"
import AlertLabels from "./shared/AlertLabels"
import SilenceNew from "../silences/SilenceNew"
import AlertStatus from "./AlertStatus"
import AlertRegion from "./shared/AlertRegion"

const AlertDetail = () => {
  const alertID = useShowDetailsFor()
  const { setShowDetailsFor } = useGlobalsActions()
  const { getAlertByFingerprint } = useAlertsActions()
  const alert = getAlertByFingerprint(alertID)

  const onPanelClose = () => {
    setShowDetailsFor(null)
  }

  const isAlertsLoading = useAlertsIsLoading()

  return (
    <Panel
      heading={
        <Stack gap="2">
          <AlertIcon severity={alert?.labels?.severity} />
          <span>{alert?.annotations?.summary || "Not found"}</span>
        </Stack>
      }
      opened={!!alertID}
      onClose={onPanelClose}
      size="large"
    >
      <PanelBody>
        {!alert ? (
          isAlertsLoading ? (
            <Stack gap="2">
              <span>Loading</span>
              <Spinner variant="primary" />
            </Stack>
          ) : (
            "Not found - the alert is probably not firing at the moment"
          )
        ) : (
          <DataGrid columns={2}>
            <DataGridRow>
              <DataGridHeadCell>Status</DataGridHeadCell>
              <DataGridCell>
                <AlertStatus status={alert?.labels?.status} />
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Firing Since</DataGridHeadCell>
              <DataGridCell>
                <AlertTimestamp startTimestamp={alert?.startsAt} />
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Service</DataGridHeadCell>
              <DataGridCell>{alert?.labels?.service}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Region</DataGridHeadCell>
              <DataGridCell>
                <AlertRegion
                  region={alert?.labels?.region}
                  cluster={alert?.labels?.cluster}
                />
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Description</DataGridHeadCell>
              <DataGridCell>
                <AlertDescription
                  description={alert?.annotations?.description}
                />
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Links</DataGridHeadCell>
              <DataGridCell>
                <AlertLinks alert={alert} />
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Labels</DataGridHeadCell>
              <DataGridCell>
                <AlertLabels alert={alert} />
              </DataGridCell>
            </DataGridRow>
          </DataGrid>
        )}
      </PanelBody>

      <PanelFooter>
        <SilenceNew alert={alert} />
      </PanelFooter>
    </Panel>
  )
}

export default AlertDetail
