/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "@cloudoperators/juno-ui-components"
import HintNotFound from "../shared/HintNotFound"
import HintLoading from "../shared/HintLoading"
import IssuesListItem from "./IssuesListItem"

const IssuesList = ({ items, isLoading }) => {
  return (
    <>
      {/* clickableTable Table allow changes the background by css when hovering or active*/}
      <DataGrid
        gridColumnTemplate="2fr 2fr 4fr 2fr 2fr 2fr 2fr 2fr 2fr 2fr"
        className="clickableTable"
      >
        <DataGridRow>
          <DataGridHeadCell>Primary Name</DataGridHeadCell>
          <DataGridHeadCell>Type</DataGridHeadCell>
          {/* <DataGridHeadCell>Secondary Name</DataGridHeadCell> */}
          <DataGridHeadCell>Target Remediation Date</DataGridHeadCell>
          <DataGridHeadCell>Status</DataGridHeadCell>
          <DataGridHeadCell>Severity</DataGridHeadCell>
          <DataGridHeadCell>Component Name</DataGridHeadCell>
          <DataGridHeadCell>Component Version</DataGridHeadCell>
          <DataGridHeadCell>Service Name</DataGridHeadCell>
          <DataGridHeadCell>Support Group Name</DataGridHeadCell>
          <DataGridHeadCell>Instance Count</DataGridHeadCell>
        </DataGridRow>
        {isLoading && !items ? (
          <DataGridRow>
            <DataGridCell colSpan={10}>
              <HintLoading className="my-4" text="Loading issues..." />
            </DataGridCell>
          </DataGridRow>
        ) : (
          <>
            {items?.length > 0 ? (
              <>
                {items.map((item, index) => (
                  <IssuesListItem key={index} item={item}></IssuesListItem>
                ))}
              </>
            ) : (
              <DataGridRow>
                <DataGridCell colSpan={10}>
                  <HintNotFound text="No issues found" />
                </DataGridCell>
              </DataGridRow>
            )}
          </>
        )}
      </DataGrid>
    </>
  )
}

export default IssuesList
