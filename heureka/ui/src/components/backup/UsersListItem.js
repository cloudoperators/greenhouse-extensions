/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"
import { USERS_PATH } from "./AppRouter"
import { Link } from "url-state-router"
import Avatar from "./Avatar"
import CustomBadge from "./CustomBadge"

const UserListItem = ({ item }) => {
  const ownServices = useMemo(() => {
    if (!item.OwnServices) return []
    return item.OwnServices
  }, [item.OwnServices])

  const evidences = useMemo(() => {
    if (!item.Evidences) return []
    return item.Evidences
  }, [item.Evidences])

  return (
    <DataGridRow>
      <DataGridCell>
        <Link to={`${USERS_PATH}/${item.ID}`}>
          <Avatar user={item} displayName />
        </Link>
      </DataGridCell>
      <DataGridCell>{item.SapID}</DataGridCell>
      <DataGridCell>Services team</DataGridCell>
      <DataGridCell>
        <CustomBadge icon="dns" label={ownServices.length} />
      </DataGridCell>
    </DataGridRow>
  )
}

export default UserListItem
