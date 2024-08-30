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
import IssueMatchesListItem from "./IssueMatchesListItem"

const IssueMatchesList = ({ items, isLoading }) => {
  return (
    <>
      {/* clickableTable Table allow changes the background by css when hovering or active*/}
      <DataGrid columns={6} className="clickableTable">
        <DataGridRow>
          <DataGridHeadCell>Primary Name</DataGridHeadCell>
          {/* <DataGridHeadCell>Secondary Name</DataGridHeadCell> */}
          <DataGridHeadCell>Target Remediation Date</DataGridHeadCell>
          <DataGridHeadCell>Status</DataGridHeadCell>
          <DataGridHeadCell>Severity</DataGridHeadCell>
          <DataGridHeadCell>Service Name</DataGridHeadCell>
          <DataGridHeadCell>Support Group Name</DataGridHeadCell>
        </DataGridRow>
        {isLoading && !items ? (
          <DataGridRow>
            <DataGridCell colSpan={6}>
              <HintLoading className="my-4" text="Loading issue matches..." />
            </DataGridCell>
          </DataGridRow>
        ) : (
          <>
            {items?.length > 0 ? (
              <>
                {items.map((item, index) => (
                  <IssueMatchesListItem
                    key={index}
                    item={item}
                  ></IssueMatchesListItem>
                ))}
              </>
            ) : (
              <DataGridRow>
                <DataGridCell colSpan={6}>
                  <HintNotFound text="No issue matches found" />
                </DataGridCell>
              </DataGridRow>
            )}
          </>
        )}
      </DataGrid>
    </>
  )
}

export default IssueMatchesList
