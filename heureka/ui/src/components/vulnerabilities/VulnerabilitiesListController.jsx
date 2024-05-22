/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useQueryClientFnReady,
  useQueryOptions,
  useActions,
} from "../StoreProvider"
import VulnerabilitiesList from "./VulnerabilitiesList"
import { Pagination } from "juno-ui-components"

const VulnerabilitiesListController = () => {
  const queryClientFnReady = useQueryClientFnReady()
  const queryOptions = useQueryOptions("vulnerabilities")
  const { setQueryOptions } = useActions()

  const { isLoading, isFetching, isError, data, error } = useQuery({
    queryKey: [`vulnerabilities`, queryOptions],
    enabled: !!queryClientFnReady,
  })

  const [currentPage, setCurrentPage] = useState(1) // State for current page

  const vulnerabilities = useMemo(() => {
    if (!data) return null
    return data?.VulnerabilityMatches?.edges
  }, [data])

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.VulnerabilityMatches?.pageInfo
  }, [data])

  const totalPages = useMemo(() => {
    if (!data?.VulnerabilityMatches?.pageInfo?.pages) return 0
    return data?.VulnerabilityMatches?.pageInfo?.pages.length
  }, [data?.VulnerabilityMatches?.pageInfo])

  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage) // Update currentPage
    if (!data?.VulnerabilityMatches?.pageInfo?.pages) return
    const pages = data?.VulnerabilityMatches?.pageInfo?.pages
    const currentPageIndex = pages?.findIndex(
      (page) => page?.pageNumber === parseInt(newPage)
    )
    if (currentPageIndex > -1) {
      const after = pages[currentPageIndex]?.after
      setQueryOptions("vulnerabilities", {
        ...queryOptions,
        after: `${after}`,
      })
    }
  }

  const onPressNext = () => {
    onPaginationChanged(parseInt(currentPage) + 1)
  }
  const onPressPrevious = () => {
    onPaginationChanged(parseInt(currentPage) - 1)
  }

  return (
    <>
      <VulnerabilitiesList
        vulnerabilities={vulnerabilities}
        isLoading={isLoading}
      />
      <Pagination
        currentPage={currentPage}
        isFirstPage={currentPage === 1}
        isLastPage={currentPage === totalPages}
        onPressNext={onPressNext}
        onPressPrevious={onPressPrevious}
        onSelectChange={onPaginationChanged}
        pages={totalPages}
        variant="input"
      />
    </>
  )
}

export default VulnerabilitiesListController
