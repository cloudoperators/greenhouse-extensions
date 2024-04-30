/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from "react"
import useStore from "../hooks/useStore"
import { useActions } from "messages-provider"
import { Container } from "juno-ui-components"
import { getUsers, getUserFilters } from "../queries"
import UsersList from "./UsersList"
import HintLoading from "./HintLoading"
import FilterToolbar from "./FilterToolbar"
import { parseError } from "../helpers"
import Pagination from "./Pagination"

const ITEMS_PER_PAGE = 10

const Users = ({}) => {
  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))
  const { addMessage } = useActions()
  const [paginationOptions, setPaginationOptions] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  })
  const [searchOptions, setSearchOptions] = useState({})
  const users = getUsers(auth?.id_token, endpoint, {
    ...paginationOptions,
    ...searchOptions,
  })

  const filters = getUserFilters(auth?.id_token, endpoint)

  useEffect(() => {
    if (users.error) {
      addMessage({
        variant: "error",
        text: parseError(users.error),
      })
    }
  }, [users.error])

  useEffect(() => {
    if (filters.error) {
      addMessage({
        variant: "error",
        text: parseError(filters.error),
      })
    }
  }, [filters.error])

  const onPaginationChanged = (offset) => {
    setPaginationOptions({ ...paginationOptions, offset: offset })
  }

  const onSearchTerm = (options) => {
    setSearchOptions(options)
  }

  return (
    <Container px={false}>
      {users.isLoading && !users.data ? (
        <HintLoading text="Loading users..." />
      ) : (
        <>
          <FilterToolbar
            filterTypes={filters.data}
            onSearchTerm={onSearchTerm}
            isLoading={filters.isLoading}
          />
          <UsersList users={users.data?.Results} />
          <Pagination
            count={users.data?.Count}
            limit={ITEMS_PER_PAGE}
            onChanged={onPaginationChanged}
            isFetching={users.isFetching}
            disabled={users.isError}
          />
        </>
      )}
    </Container>
  )
}

export default Users
