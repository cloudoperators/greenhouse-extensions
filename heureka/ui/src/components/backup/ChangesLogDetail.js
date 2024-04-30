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
  TextareaRow,
} from "juno-ui-components"
import {
  DetailSection,
  DetailSectionBox,
  DetailContentHeading,
  DetailSectionHeader,
} from "../styles"
import { changeLogExample1, changeLogExample2 } from "../helpers"
import { useRouter } from "url-state-router"
import { DateTime } from "luxon"
import ComponentsList from "./ComponentsList"
import { SERVICES_PATH } from "./AppRouter"

const ChangesLogDetail = ({}) => {
  const { options, routeParams, navigateTo } = useRouter()
  const changeLogId = routeParams?.changeLogId
  const serviceId = routeParams?.serviceId

  const change = useMemo(() => {
    if (changeLogId === "4323") {
      return changeLogExample1
    }
    if (changeLogId === "1234") {
      return changeLogExample2
    }
    return {}
  }, [changeLogId])

  const createdAt = useMemo(() => {
    if (change?.CreatedAt) {
      return DateTime.fromSQL(change.CreatedAt).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    }
  }, [change?.CreatedAt])

  const onPanelClose = () => {
    navigateTo(`${SERVICES_PATH}/${serviceId}`)
  }

  return (
    <Panel heading="Change log details" opened={true} onClose={onPanelClose}>
      <PanelBody>
        <div className={DetailSection}>
          <div className={DetailSectionBox}>
            <DataGrid gridColumnTemplate="1fr 9fr">
              <DataGridRow>
                <DataGridCell>
                  <b>ID: </b>
                </DataGridCell>
                <DataGridCell>{change.ID}</DataGridCell>
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
        {change.Type === "manually" && (
          <>
            <div className={DetailSection}>
              <p className={DetailSectionHeader}>Components</p>
              <div className="mt-4">
                <ComponentsList
                  columns={{
                    name: {},
                    type: {},
                    version: {},
                  }}
                  unlink
                  components={change.Components}
                />
              </div>
            </div>

            <div className={DetailSection}>
              <TextareaRow
                label="Reason"
                value="Add custom constraints to fix vulnerability CVE-2022-3043. See https://nvd.nist.gov/vuln/detail/CVE-2022-3043"
                onChange={function noRefCheck() {}}
              />
            </div>
          </>
        )}
        {change.Type === "automatic" && (
          <>
            <div className={DetailSection}>
              <p className={DetailSectionHeader}>State before</p>
              <div className="mt-4">
                <ComponentsList
                  columns={{
                    name: {},
                    type: {},
                    version: {},
                    vulnerabilities: {},
                  }}
                  unlink
                  components={change.BeforeState}
                />
              </div>
            </div>
            <div className={DetailSection}>
              <p className={DetailSectionHeader}>State after</p>
              <div className="mt-4">
                <ComponentsList
                  columns={{
                    name: {},
                    type: {},
                    version: {},
                    vulnerabilities: {},
                  }}
                  unlink
                  components={change.AfterState}
                />
              </div>
            </div>
          </>
        )}
      </PanelBody>
    </Panel>
  )
}

export default ChangesLogDetail
