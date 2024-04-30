/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from "react"
import useStore from "../hooks/useStore"
import { useActions } from "messages-provider"
import { Stack, Spinner, Container } from "juno-ui-components"
import { getVulnerabilities, getVulnerabilityFilters } from "../queries"
import { parseError } from "../helpers"
import Pagination from "./Pagination"
import VulnerabilitiesList from "./VulnerabilitiesList"
import FilterToolbar from "./FilterToolbar"
import HintLoading from "./HintLoading"

const ITEMS_PER_PAGE = 10

const Vulnerabilities = ({}) => {
  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))
  const { addMessage } = useActions()
  const [paginationOptions, setPaginationOptions] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  })
  const [searchOptions, setSearchOptions] = useState({})
  const vulnerabilities = getVulnerabilities(auth?.id_token, endpoint, {
    ...paginationOptions,
    ...searchOptions,
  })
  const filters = getVulnerabilityFilters(auth?.id_token, endpoint)

  // dispatch error with useEffect because error variable will first set once all retries did not succeed
  useEffect(() => {
    if (vulnerabilities.error) {
      addMessage({
        variant: "error",
        text: parseError(vulnerabilities.error),
      })
    }
  }, [vulnerabilities.error])

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
      {vulnerabilities.isLoading && !vulnerabilities.data ? (
        <HintLoading text="Loading vulnerabilities..." />
      ) : (
        <>
          <FilterToolbar
            filterTypes={filters.data}
            onSearchTerm={onSearchTerm}
            isLoading={filters.isLoading}
          />
          <VulnerabilitiesList
            vulnerabilities={vulnerabilities.data?.Results}
          />
          <Pagination
            count={vulnerabilities.data?.Count}
            limit={ITEMS_PER_PAGE}
            onChanged={onPaginationChanged}
            isFetching={vulnerabilities.isFetching}
            disabled={vulnerabilities.isError}
          />
        </>
      )}
    </Container>
  )
}

export default Vulnerabilities
