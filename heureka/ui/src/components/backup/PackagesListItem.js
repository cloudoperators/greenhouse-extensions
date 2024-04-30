/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"

const PackagesListItem = ({ item }) => {
  return (
    <DataGridRow>
      <DataGridCell>{item.Name}</DataGridCell>
      <DataGridCell>{item.Version}</DataGridCell>
      <DataGridCell>{item.CPE}</DataGridCell>
    </DataGridRow>
  )
}

export default PackagesListItem
