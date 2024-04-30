/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell, Button } from "juno-ui-components"
import { DateTime } from "luxon"
import CustomBadge from "./CustomBadge"
import { Link } from "url-state-router"
import { useRouter } from "url-state-router"
import { SERVICES_PATH } from "./AppRouter"

const PatchLogsListItem = ({ item }) => {
  const { options, routeParams } = useRouter()
  const serviceId = routeParams?.serviceId

  const createdAt = useMemo(() => {
    if (item.CreatedAt) {
      return DateTime.fromSQL(item.CreatedAt).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    }
  }, [item.CreatedAt])

  return (
    <DataGridRow>
      <DataGridCell>
        <Link to={`${SERVICES_PATH}/${serviceId}/patchLog/${item.ID}`}>
          {item.ID}
        </Link>
      </DataGridCell>
      <DataGridCell>{createdAt}</DataGridCell>
      <DataGridCell>
        <CustomBadge icon="edit" label={item?.Changes?.length} />
      </DataGridCell>
      <DataGridCell>
        <CustomBadge icon="info" label={item.Evidences.length} />
      </DataGridCell>
    </DataGridRow>
  )
}

export default PatchLogsListItem
