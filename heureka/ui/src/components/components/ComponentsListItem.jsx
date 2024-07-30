/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { DataGridRow, DataGridCell } from "@cloudoperators/juno-ui-components"
import { listOfCommaSeparatedObjs } from "../shared/Helper"

const ComponentsListItem = ({ item }) => {
  return (
    <DataGridRow>
      <DataGridCell>{item?.node?.name}</DataGridCell>
      <DataGridCell>{item?.node?.type}</DataGridCell>
      <DataGridCell></DataGridCell>
    </DataGridRow>
  )
}

export default ComponentsListItem
