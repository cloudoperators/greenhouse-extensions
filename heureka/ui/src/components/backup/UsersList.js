/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  Stack,
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
} from "juno-ui-components"
import UserListItem from "./UsersListItem"
import HintNotFound from "./HintNotFound"

const UsersList = ({ users }) => {
  users = useMemo(() => {
    if (!users) return []
    return users
  }, [users])

  return (
    <>
      <DataGrid columns={4}>
        <DataGridRow>
          <DataGridHeadCell>Name</DataGridHeadCell>
          <DataGridHeadCell>SAP ID</DataGridHeadCell>
          <DataGridHeadCell>Support group</DataGridHeadCell>
          <DataGridHeadCell>Owned services</DataGridHeadCell>
        </DataGridRow>
        {users.length > 0 ? (
          <>
            {users.map((user, index) => (
              <UserListItem key={index} item={user} />
            ))}
          </>
        ) : (
          <DataGridRow>
            <DataGridCell colSpan={4}>
              <HintNotFound text="No users found" />
            </DataGridCell>
          </DataGridRow>
        )}
      </DataGrid>
    </>
  )
}

export default UsersList
