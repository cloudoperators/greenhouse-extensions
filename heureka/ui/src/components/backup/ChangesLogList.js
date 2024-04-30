/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import ChangesLogListItem from "./ChangesLogListItem"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "juno-ui-components"
import HintNotFound from "./HintNotFound"

const ChangesLogList = ({ changes, selectable }) => {
  changes = useMemo(() => {
    if (!changes) return []
    return changes
  }, [changes])

  const columnsLength = useMemo(() => {
    const configurableCols = 4
    return selectable ? configurableCols + 1 : configurableCols
  }, [selectable])

  return (
    <>
      <DataGrid columns={columnsLength}>
        <DataGridRow>
          {selectable && <DataGridHeadCell></DataGridHeadCell>}
          <DataGridHeadCell>ID</DataGridHeadCell>
          <DataGridHeadCell>Type</DataGridHeadCell>
          <DataGridHeadCell>Date</DataGridHeadCell>
          <DataGridHeadCell>Changed components</DataGridHeadCell>
        </DataGridRow>
        {changes.length > 0 ? (
          <>
            {changes.map((item, i) => (
              <ChangesLogListItem key={i} item={item} selectable={selectable} />
            ))}
          </>
        ) : (
          <DataGridRow>
            <DataGridCell colSpan={columnsLength}>
              <HintNotFound text="No changes found" />
            </DataGridCell>
          </DataGridRow>
        )}
      </DataGrid>
    </>
  )
}

export default ChangesLogList
