/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
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
      <DataGridCell></DataGridCell>
      <DataGridCell>{item?.State}</DataGridCell>
    </DataGridRow>
  )
}

export default VulnerabilitiesListItem
