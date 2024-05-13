/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useQueryClientFnReady,
  useQueryOptions,
  useActions,
} from "../StoreProvider"
import VulnerabilitiesList from "./VulnerabilitiesList"
import { Pagination } from "juno-ui-components"

// targetRemediationDate
// discoveryDate
// severity
// remediationDate (detailview)

const VulnerabilitiesListController = () => {
  const queryClientFnReady = useQueryClientFnReady()
  const queryOptions = useQueryOptions("vulnerabilities")
  const { setQueryOptions } = useActions()

  const { isLoading, isFetching, isError, data, error } = useQuery({
    queryKey: [`vulnerabilities`, queryOptions],
    enabled: !!queryClientFnReady,
  })

  const vulnerabilities = useMemo(() => {
    if (!data) return null
    return data?.VulnerabilityMatches?.edges
  }, [data])

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.VulnerabilityMatches?.pageInfo
  }, [data])

  const { currentPage, totalPages } = useMemo(() => {
    if (!data?.VulnerabilityMatches?.pageInfo?.pages) return {}
    const pages = data?.VulnerabilityMatches?.pageInfo?.pages
    let currentPage = null
    const currentPageIndex = pages?.findIndex((page) => page?.isCurrent)
    if (currentPageIndex > -1) {
      currentPage = pages[currentPageIndex]?.pageNumber
    }
    const totalPages = pages?.length
    return { currentPage, totalPages }
  }, [data?.VulnerabilityMatches?.pageInfo])

  const onPaginationChanged = (newPage) => {
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

  return (
    <>
      <VulnerabilitiesList
        vulnerabilities={vulnerabilities}
        isLoading={isLoading}
      />
      <Pagination
        currentPage={currentPage}
        onSelectChange={onPaginationChanged}
        pages={totalPages}
        variant="select"
      />
    </>
  )
}

export default VulnerabilitiesListController
