/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState, useMemo } from "react"
import useStore from "../hooks/useStore"
import { useActions } from "messages-provider"
import { Container } from "juno-ui-components"
import { getServices, getServiceFilters } from "../queries"
import { parseError } from "../helpers"
import Pagination from "./Pagination"
import ServicesList from "./ServicesList"
import FilterToolbar from "./FilterToolbar"
import HintLoading from "./HintLoading"

const ITEMS_PER_PAGE = 10

const Services = ({}) => {
  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))
  const addMessage = useActions()
  const [paginationOptions, setPaginationOptions] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  })
  const [searchOptions, setSearchOptions] = useState({})
  const services = getServices(auth?.id_token, endpoint, {
    ...paginationOptions,
    ...searchOptions,
  })
  const filters = getServiceFilters(auth?.id_token, endpoint)

  // dispatch error with useEffect because error variable will first set once all retries did not succeed
  useEffect(() => {
    if (services.error) {
      addMessage({
        variant: "error",
        text: parseError(services.error),
      })
    }
  }, [services.error])

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

  return useMemo(() => {
    return (
      <Container px={false}>
        {services.isLoading && !services.data ? (
          <HintLoading text="Loading services..." />
        ) : (
          <>
            <FilterToolbar
              filterTypes={filters.data}
              onSearchTerm={onSearchTerm}
              isLoading={filters.isLoading}
              filterLabels={{ name: "service name" }}
              placeholders={{
                operators: "User ID or name",
                owners: "User ID or name",
              }}
            />
            <ServicesList services={services.data?.Results} />
            <Pagination
              count={services.data?.Count}
              limit={ITEMS_PER_PAGE}
              onChanged={onPaginationChanged}
              isFetching={services.isFetching}
              disabled={services.isError}
            />
          </>
        )}
      </Container>
    )
  }, [services, filters])
}

export default Services
