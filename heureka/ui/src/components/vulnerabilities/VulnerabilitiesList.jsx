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
} from "juno-ui-components"
import HintNotFound from "../shared/HintNotFound"
import HintLoading from "../shared/HintLoading"
import VulnerabilitiesListItem from "./VulnerabilitiesListItem"

const VulnerabilitiesList = ({ vulnerabilities, isLoading }) => {
  return (
    <DataGrid columns={8}>
      <DataGridRow>
        <DataGridHeadCell>SCN/CVE</DataGridHeadCell>
        <DataGridHeadCell>Status</DataGridHeadCell>
        <DataGridHeadCell>Severity</DataGridHeadCell>
        <DataGridHeadCell>Component Name</DataGridHeadCell>
        <DataGridHeadCell>Component Version</DataGridHeadCell>
        <DataGridHeadCell>Service Name</DataGridHeadCell>
        <DataGridHeadCell>Support Group Name</DataGridHeadCell>
        <DataGridHeadCell>Instance Count</DataGridHeadCell>
      </DataGridRow>
      {isLoading && !vulnerabilities ? (
        <HintLoading className="my-4" text="Loading vulnerabilities..." />
      ) : (
        <>
          {vulnerabilities?.length > 0 ? (
            <>
              {vulnerabilities.map((item, index) => (
                <VulnerabilitiesListItem
                  key={index}
                  item={item}
                ></VulnerabilitiesListItem>
              ))}
            </>
          ) : (
            <DataGridRow>
              <DataGridCell colSpan={8}>
                <HintNotFound text="No vulnerabilities found" />
              </DataGridCell>
            </DataGridRow>
          )}
        </>
      )}
    </DataGrid>
  )
}

export default VulnerabilitiesList
