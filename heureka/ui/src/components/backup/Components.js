/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useState } from "react"
import { getComponents, getComponentFilters } from "../queries"
import useStore from "../hooks/useStore"
import { useActions } from "messages-provider"
import { parseError } from "../helpers"
import { Container } from "juno-ui-components"
import Pagination from "./Pagination"
import ComponentsList from "./ComponentsList"
import FilterToolbar from "./FilterToolbar"
import HintLoading from "./HintLoading"

const ITEMS_PER_PAGE = 10

const Components = () => {
  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))
  const { addMessage } = useActions()
  const [paginationOptions, setPaginationOptions] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  })
  const [searchOptions, setSearchOptions] = useState({})
  const components = getComponents(auth?.id_token, endpoint, {
    ...paginationOptions,
    ...searchOptions,
  })

  const filters = getComponentFilters(auth?.id_token, endpoint)

  // dispatch error with useEffect because error variable will first set once all retries did not succeed
  useEffect(() => {
    if (components.error) {
      addMessage({
        variant: "error",
        text: parseError(components.error),
      })
    }
  }, [components.error])

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
      {components.isLoading && !components.data ? (
        <HintLoading text="Loading components..." />
      ) : (
        <>
          <FilterToolbar
            filterTypes={filters.data}
            onSearchTerm={onSearchTerm}
            isLoading={filters.isLoading}
            filterLabels={{
              name: "component name",
            }}
            placeholders={{
              operators: "User ID or name",
              owners: "User ID or name",
              inKeppel: `"true" or "false"`,
            }}
          />
          <ComponentsList components={components.data?.Results} />
          <Pagination
            disabled={components.isError}
            count={components.data?.Count}
            limit={ITEMS_PER_PAGE}
            onChanged={onPaginationChanged}
            isFetching={components.isFetching}
          />
        </>
      )}
    </Container>
  )
}

export default Components
