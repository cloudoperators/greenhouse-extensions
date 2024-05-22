/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"

const IdClasses = `
text-sm 
pt-1
whitespace-nowrap
text-theme-disabled
`
const VulnerabilityCss = `
flex
`

const VulnerabilitiesListItem = ({ item }) => {
  const lastModifiedtString = useMemo(() => {
    if (!item?.Scn?.ScnLastModified) return "No date available"
    return DateTime.fromSQL(item.Scn.ScnLastModified).toLocaleString(
      DateTime.DATETIME_SHORT
    )
  }, [item?.Scn?.ScnLastModified])
  return (
    <DataGridRow>
      <DataGridCell>
        <span>{item?.node?.id}</span>
      </DataGridCell>
      <DataGridCell>
        <div className={VulnerabilityCss}>
          {/* <VulnerabilityBadge
            level={item?.Scn?.ThreatLevelOverall}
            label={item?.Scn?.ThreatLevelOverall}
          /> */}
        </div>
      </DataGridCell>
      <DataGridCell>{item?.Component?.Name}</DataGridCell>
      <DataGridCell>{item?.vulnerabilityDisclosure?.lastModified}</DataGridCell>
      <DataGridCell>{item?.State}</DataGridCell>
    </DataGridRow>
  )
}

export default VulnerabilitiesListItem
