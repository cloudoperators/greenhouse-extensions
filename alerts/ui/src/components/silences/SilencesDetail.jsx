/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import {
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
  Panel,
  PanelFooter,
  Stack,
  PanelBody,
  Pill,
} from "juno-ui-components"
import {
  useShowDetailsForSilence,
  useSilencesActions,
} from "../../hooks/useAppStore"
import SilencesTimestamp from "./shared/SilencesTimestamp"
import ExpireSilence from "./ExpireSilence"

const SilencesDetail = () => {
  const silenceID = useShowDetailsForSilence()

  const { getSilenceById } = useSilencesActions()
  const silence = getSilenceById(silenceID)

  const { setShowDetailsForSilence } = useSilencesActions()

  const onPanelClose = () => {
    setShowDetailsForSilence(false)
  }

  return (
    <Panel
      heading={
        <Stack gap="2">
          <span>{silence?.id}</span>
        </Stack>
      }
      opened={!!silence}
      onClose={onPanelClose}
      size="large"
    >
      <PanelBody>
        <DataGrid className="overflow-hidden" columns={2}>
          <DataGridRow>
            <DataGridHeadCell>Status</DataGridHeadCell>
            <DataGridCell>{silence?.status?.state}</DataGridCell>
          </DataGridRow>
          <DataGridRow>
            <DataGridHeadCell>ID</DataGridHeadCell>
            <DataGridCell>{silence?.id}</DataGridCell>
          </DataGridRow>
          <DataGridRow>
            <DataGridHeadCell>Comment</DataGridHeadCell>
            <DataGridCell>{silence?.comment}</DataGridCell>
          </DataGridRow>
          <DataGridRow>
            <DataGridHeadCell>Created By</DataGridHeadCell>
            <DataGridCell>{silence?.createdBy}</DataGridCell>
          </DataGridRow>
          <DataGridRow>
            <DataGridHeadCell>Starts at</DataGridHeadCell>
            <DataGridCell>
              <SilencesTimestamp timestamp={silence?.startsAt} />
            </DataGridCell>
          </DataGridRow>
          <DataGridRow>
            <DataGridHeadCell>Ends at</DataGridHeadCell>
            <DataGridCell>
              <SilencesTimestamp timestamp={silence?.endsAt} />
            </DataGridCell>
          </DataGridRow>
          <DataGridRow>
            <DataGridHeadCell>Matchers</DataGridHeadCell>
            <DataGridCell>
              <Stack gap="2" alignment="start" wrap={true}>
                {silence?.matchers?.map((matcher, index) => (
                  <Pill
                    key={index}
                    pillKey={matcher.name}
                    pillValue={matcher.value}
                  />
                ))}
              </Stack>
            </DataGridCell>
          </DataGridRow>
        </DataGrid>
      </PanelBody>

      <PanelFooter>
        {["active", "pending"].includes(silence?.status?.state) && (
          <>
            <ExpireSilence silence={silence} />
          </>
        )}
      </PanelFooter>
    </Panel>
  )
}

export default SilencesDetail
