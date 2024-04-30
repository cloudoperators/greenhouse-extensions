/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell, Button } from "juno-ui-components"
import { DateTime } from "luxon"
import { Link } from "url-state-router"
import { useRouter } from "url-state-router"
import { SERVICES_PATH } from "./AppRouter"

const EvidencesListItem = ({ item }) => {
  const { options, routeParams } = useRouter()
  const evidenceId = routeParams?.evidenceId

  const createdAt = useMemo(() => {
    if (item.CreatedAt) {
      return DateTime.fromSQL(item.CreatedAt).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    }
  }, [item.CreatedAt])

  return (
    <DataGridRow>
      <DataGridCell>{item.ID}</DataGridCell>
      <DataGridCell>{createdAt}</DataGridCell>
    </DataGridRow>
  )
}

export default EvidencesListItem
