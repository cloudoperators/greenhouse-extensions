/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  Button,
  Panel,
  PanelBody,
  PanelFooter,
  DataGrid,
  DataGridRow,
  DataGridCell,
  Stack,
} from "juno-ui-components"
import {
  DetailSection,
  DetailSectionBox,
  DetailContentHeading,
  DetailSectionHeader,
} from "../styles"
import { patchExampl1, patchExampl2 } from "../helpers"
import { useRouter } from "url-state-router"
import { DateTime } from "luxon"
import EvidencesList from "./EvidencesList"
import { SERVICES_PATH } from "./AppRouter"
import ChangesLogList from "./ChangesLogList"

const PatchLogDetail = ({}) => {
  const { options, routeParams, navigateTo } = useRouter()
  const patchLogId = routeParams?.patchLogId
  const serviceId = routeParams?.serviceId

  const patch = useMemo(() => {
    if (patchLogId === "123") {
      return patchExampl1
    }
    if (patchLogId === "456") {
      return patchExampl2
    }
  }, [patchLogId])

  const createdAt = useMemo(() => {
    if (patch?.CreatedAt) {
      return DateTime.fromSQL(patch.CreatedAt).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    }
  }, [patch?.CreatedAt])

  const onPanelClose = () => {
    navigateTo(`${SERVICES_PATH}/${serviceId}`)
  }

  return (
    <Panel heading="Patch log details" opened={true} onClose={onPanelClose}>
      <PanelBody>
        <div className={DetailSection}>
          <div className={DetailSectionBox}>
            <DataGrid gridColumnTemplate="1fr 9fr">
              <DataGridRow>
                <DataGridCell>
                  <b>ID: </b>
                </DataGridCell>
                <DataGridCell>{patch.ID}</DataGridCell>
              </DataGridRow>
              <DataGridRow>
                <DataGridCell>
                  <b>Date: </b>
                </DataGridCell>
                <DataGridCell>{createdAt}</DataGridCell>
              </DataGridRow>
            </DataGrid>
          </div>
        </div>

        <div className={DetailSection}>
          <Stack alignment="center">
            <p className={`${DetailSectionHeader} w-full`}>Changes</p>
            <Button
              label="Add"
              onClick={function noRefCheck() {}}
              size="small"
            />
          </Stack>
          <div className="mt-4">
            <ChangesLogList changes={patch.Changes} />
          </div>
        </div>

        <div className={DetailSection}>
          <Stack alignment="center">
            <p className={`${DetailSectionHeader} w-full`}>Evidences</p>
            <Button
              label="Add"
              onClick={function noRefCheck() {}}
              size="small"
            />
          </Stack>
          <div className="mt-4">
            <EvidencesList evidences={[]} />
          </div>
        </div>
      </PanelBody>
    </Panel>
  )
}

export default PatchLogDetail
