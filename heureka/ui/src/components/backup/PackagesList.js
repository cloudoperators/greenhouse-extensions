/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGrid, DataGridRow, DataGridHeadCell } from "juno-ui-components"
import PackagesListItem from "./PackagesListItem"

const PackagesList = ({ packages }) => {
  packages = useMemo(() => {
    if (!packages) return []
    // inforce input as array
    if (!Array.isArray(packages)) packages = [packages]
    return packages
  }, [packages])

  return (
    <DataGrid columns={3}>
      <DataGridRow>
        <DataGridHeadCell>Name</DataGridHeadCell>
        <DataGridHeadCell>Version</DataGridHeadCell>
        <DataGridHeadCell>CPE</DataGridHeadCell>
      </DataGridRow>
      {packages.map((item, index) => (
        <PackagesListItem key={index} item={item}></PackagesListItem>
      ))}
    </DataGrid>
  )
}

export default PackagesList
