/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import ComponentsListItem from "./ComponentsListItem"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "juno-ui-components"
import HintNotFound from "./HintNotFound"
import { classifyVulnerabilities } from "../helpers"

const ComponentsList = ({
  components,
  columns,
  sorted,
  unlink,
  selectable,
}) => {
  components = useMemo(() => {
    if (!components) return []
    // inforce input as array
    if (!Array.isArray(components)) components = [components]
    // sort components by threat level
    if (sorted) {
      return components
        .sort((a, b) => {
          const vulA = classifyVulnerabilities(a)
          const vulB = classifyVulnerabilities(b)
          return (
            vulA.critical - vulB.critical ||
            vulA.high - vulB.high ||
            vulA.medium - vulB.medium ||
            vulA.low - vulB.low
          )
        })
        .reverse()
    }
    return components
  }, [components])

  columns = useMemo(() => {
    if (!columns) {
      return {
        name: {},
        type: {},
        version: {},
        vulnerabilities: {},
        belongsTo: {},
        owners: {},
        operators: {},
      }
    }
    return columns
  }, [columns])

  const columnsLength = useMemo(() => {
    const configurableCols = columns ? Object.keys(columns).length : 7
    return selectable ? configurableCols + 1 : configurableCols
  }, [columns, selectable])

  return (
    <DataGrid columns={columnsLength}>
      <DataGridRow>
        {selectable && <DataGridHeadCell></DataGridHeadCell>}
        {columns?.name && <DataGridHeadCell>Name</DataGridHeadCell>}
        {columns?.type && <DataGridHeadCell>Type</DataGridHeadCell>}
        {columns?.version && <DataGridHeadCell>Version</DataGridHeadCell>}
        {columns?.vulnerabilities && (
          <DataGridHeadCell>Vulnerabilities</DataGridHeadCell>
        )}
        {columns?.belongsTo && <DataGridHeadCell>Belongs to</DataGridHeadCell>}
        {columns?.owners && <DataGridHeadCell>Owners</DataGridHeadCell>}
        {columns?.operators && <DataGridHeadCell>Operators</DataGridHeadCell>}
      </DataGridRow>
      {components.length > 0 ? (
        <>
          {components.map((item, i) => (
            <ComponentsListItem
              key={i}
              item={item}
              columns={columns}
              unlink={unlink}
              selectable={selectable}
            />
          ))}
        </>
      ) : (
        <DataGridRow>
          <DataGridCell colSpan={columnsLength}>
            <HintNotFound text="No components found" />
          </DataGridCell>
        </DataGridRow>
      )}
    </DataGrid>
  )
}

export default ComponentsList
