/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell, CheckboxRow } from "juno-ui-components"
import { DateTime } from "luxon"
import { Link } from "url-state-router"
import { useRouter } from "url-state-router"
import { SERVICES_PATH } from "./AppRouter"

const ChangesLogListItem = ({ item, selectable }) => {
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
      {selectable && (
        <DataGridCell>
          <CheckboxRow
            id="selectable"
            label=" "
            onChange={function noRefCheck() {}}
          />
        </DataGridCell>
      )}
      <DataGridCell>
        <Link to={`${SERVICES_PATH}/${serviceId}/changeLog/${item.ID}`}>
          {item.ID}
        </Link>
      </DataGridCell>
      <DataGridCell>{item.Type}</DataGridCell>
      <DataGridCell>{createdAt}</DataGridCell>
      <DataGridCell>
        {item.Components.map((component) => component.Name).join(", ")}
      </DataGridCell>
    </DataGridRow>
  )
}

export default ChangesLogListItem
