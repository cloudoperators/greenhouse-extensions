/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import EvidencesListItem from "./EvidencesListItem"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "juno-ui-components"
import HintNotFound from "./HintNotFound"

const EvidencesList = ({ evidences }) => {
  evidences = useMemo(() => {
    if (!evidences) return []
    return evidences
  }, [evidences])

  return (
    <>
      <DataGrid columns={2}>
        <DataGridRow>
          <DataGridHeadCell>ID</DataGridHeadCell>
          <DataGridHeadCell>Date</DataGridHeadCell>
        </DataGridRow>
        {evidences.length > 0 ? (
          <>
            {evidences.map((item, i) => (
              <EvidencesListItem key={i} item={item} />
            ))}
          </>
        ) : (
          <DataGridRow>
            <DataGridCell colSpan={2}>
              <HintNotFound text="No evidences found" />
            </DataGridCell>
          </DataGridRow>
        )}
      </DataGrid>
    </>
  )
}

export default EvidencesList
