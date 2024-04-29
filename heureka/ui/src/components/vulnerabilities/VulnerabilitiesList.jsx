/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
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
    <DataGrid columns={5}>
      <DataGridRow>
        <DataGridHeadCell>SCN/CVE</DataGridHeadCell>
        <DataGridHeadCell>Threat level</DataGridHeadCell>
        <DataGridHeadCell>Component</DataGridHeadCell>
        <DataGridHeadCell>Last modified</DataGridHeadCell>
        <DataGridHeadCell>State</DataGridHeadCell>
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
              <DataGridCell colSpan={5}>
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
