/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Stack,
} from "juno-ui-components"
import VulnerabilitiesListItem from "./VulnerabilitiesListItem"
import { threadLevelToWeight } from "../helpers"
import HintNotFound from "./HintNotFound"

const VulnerabilitiesList = ({ vulnerabilities, sortBy, minimized }) => {
  vulnerabilities = useMemo(() => {
    if (!vulnerabilities) return []
    if (!Array.isArray(vulnerabilities)) vulnerabilities = [vulnerabilities]
    if (sortBy === "ThreatLevelOverall") {
      return vulnerabilities
        .sort(
          (a, b) =>
            threadLevelToWeight(a[sortBy]) - threadLevelToWeight(b[sortBy])
        )
        .reverse()
    }
    return vulnerabilities
  }, [vulnerabilities])

  return (
    <DataGrid columns={minimized ? 4 : 5}>
      <DataGridRow>
        <DataGridHeadCell>SCN/CVE</DataGridHeadCell>
        <DataGridHeadCell>Threat level</DataGridHeadCell>
        {!minimized && <DataGridHeadCell>Component</DataGridHeadCell>}
        <DataGridHeadCell>Last modified</DataGridHeadCell>
        <DataGridHeadCell>State</DataGridHeadCell>
      </DataGridRow>
      {vulnerabilities.length > 0 ? (
        <>
          {" "}
          {vulnerabilities.map((item, index) => (
            <VulnerabilitiesListItem
              key={index}
              item={item}
              minimized={minimized}
            ></VulnerabilitiesListItem>
          ))}
        </>
      ) : (
        <DataGridRow>
          <DataGridCell colSpan={minimized ? 4 : 5}>
            <HintNotFound text="No vulnerabilities found" />
          </DataGridCell>
        </DataGridRow>
      )}
    </DataGrid>
  )
}

export default VulnerabilitiesList
