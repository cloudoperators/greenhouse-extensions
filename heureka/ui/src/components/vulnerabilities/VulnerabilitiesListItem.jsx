/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"

const VulnerabilitiesListItem = ({ item }) => {
  return (
    <DataGridRow>
      <DataGridCell>
        <span>{item?.node?.id}</span>
      </DataGridCell>
      <DataGridCell>{item?.node?.status}</DataGridCell>
      <DataGridCell>{item?.node?.severity?.value}</DataGridCell>
      <DataGridCell>
        {item?.node?.componentInstance?.componentVersion?.component?.name}
      </DataGridCell>
      <DataGridCell>
        {item?.node?.componentInstance?.componentVersion?.version}
      </DataGridCell>
      <DataGridCell>
        {item?.node?.componentInstance?.service?.name}
      </DataGridCell>
      {/* TODO: Define how should we show more support groups inside this row */}
      <DataGridCell>
        {
          item?.node?.componentInstance?.service?.supportGroups?.edges[0]?.node
            ?.name
        }
      </DataGridCell>
      <DataGridCell>{item?.node?.componentInstance?.count}</DataGridCell>
    </DataGridRow>
  )
}

export default VulnerabilitiesListItem
