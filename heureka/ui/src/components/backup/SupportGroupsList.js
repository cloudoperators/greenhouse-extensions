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
} from "juno-ui-components"
import HintNotFound from "./HintNotFound"

const ServerGroupsList = ({ supportGroups }) => {
  supportGroups = useMemo(() => {
    if (!supportGroups) return []
    return supportGroups
  }, [supportGroups])

  return (
    <DataGrid columns={2}>
      <DataGridRow>
        <DataGridHeadCell>Name</DataGridHeadCell>
        <DataGridHeadCell>Members</DataGridHeadCell>
      </DataGridRow>
      {supportGroups.length > 0 ? (
        <>
          <span>No yet implemented</span>
        </>
      ) : (
        <DataGridRow>
          <DataGridCell colSpan={2}>
            <HintNotFound text="No support groups found" />
          </DataGridCell>
        </DataGridRow>
      )}
    </DataGrid>
  )
}

export default ServerGroupsList
