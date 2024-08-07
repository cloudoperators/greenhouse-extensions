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
    <DataGrid columns={10}>
      <DataGridRow>
        <DataGridHeadCell>Primary Name</DataGridHeadCell>
        <DataGridHeadCell>Type</DataGridHeadCell>
        {/* <DataGridHeadCell>Secondary Name</DataGridHeadCell> */}
        <DataGridHeadCell>Remediation Date</DataGridHeadCell>
        <DataGridHeadCell>Status</DataGridHeadCell>
        <DataGridHeadCell>Severity</DataGridHeadCell>
        <DataGridHeadCell>Component Name</DataGridHeadCell>
        <DataGridHeadCell>Component Version</DataGridHeadCell>
        <DataGridHeadCell>Service Name</DataGridHeadCell>
        <DataGridHeadCell>Support Group Name</DataGridHeadCell>
        <DataGridHeadCell>Instance Count</DataGridHeadCell>
      </DataGridRow>
      {isLoading && !items ? (
        <HintLoading className="my-4" text="Loading issues..." />
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
  )
}

export default IssuesList
