/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import PatchLogsListItem from "./PatchLogsListItem"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "juno-ui-components"
import HintNotFound from "./HintNotFound"

const PatchLogsList = ({ patches }) => {
  patches = useMemo(() => {
    if (!patches) return []
    return patches
  }, [patches])

  return (
    <>
      <DataGrid columns={4}>
        <DataGridRow>
          <DataGridHeadCell>ID</DataGridHeadCell>
          <DataGridHeadCell>Date</DataGridHeadCell>
          <DataGridHeadCell>Changes</DataGridHeadCell>
          <DataGridHeadCell>Evidences</DataGridHeadCell>
        </DataGridRow>
        {patches.length > 0 ? (
          <>
            {patches.map((item, i) => (
              <PatchLogsListItem key={i} item={item} />
            ))}
          </>
        ) : (
          <DataGridRow>
            <DataGridCell colSpan={4}>
              <HintNotFound text="No patches found" />
            </DataGridCell>
          </DataGridRow>
        )}
      </DataGrid>
    </>
  )
}

export default PatchLogsList
