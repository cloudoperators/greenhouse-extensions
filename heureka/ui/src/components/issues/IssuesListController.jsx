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
import IssuesList from "./IssuesList"
import {
  Container,
  Pagination,
  Stack,
} from "@cloudoperators/juno-ui-components"

const IssuesListController = () => {
  const queryClientFnReady = useQueryClientFnReady()
  const queryOptions = useQueryOptions("issues")
  const { setQueryOptions } = useActions()

  const { isLoading, isFetching, isError, data, error } = useQuery({
    queryKey: [`issues`, queryOptions],
    enabled: !!queryClientFnReady,
  })

  const [currentPage, setCurrentPage] = useState(1) // State for current page

  const issues = useMemo(() => {
    if (!data) return null
    return data?.IssueMatches?.edges
  }, [data])

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.IssueMatches?.pageInfo
  }, [data])

  const totalPages = useMemo(() => {
    if (!data?.IssueMatches?.pageInfo?.pages) return 0
    return data?.IssueMatches?.pageInfo?.pages.length
  }, [data?.IssueMatches?.pageInfo])
  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage) // Update currentPage
    if (!data?.IssueMatches?.pageInfo?.pages) return
    const pages = data?.IssueMatches?.pageInfo?.pages
    const currentPageIndex = pages?.findIndex(
      (page) => page?.pageNumber === parseInt(newPage)
    )
    if (currentPageIndex > -1) {
      const after = pages[currentPageIndex]?.after
      setQueryOptions("issues", {
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
  const onKeyPress = (oKey) => {
    if (oKey.code === "Enter") {
      onPaginationChanged(parseInt(oKey.currentTarget.value))
    }
  }

  return (
    <>
      <Container py>
        <IssuesList issues={issues} isLoading={isLoading} />
      </Container>
      <Stack direction="vertical" alignment="end">
        <Pagination
          currentPage={currentPage}
          isFirstPage={currentPage === 1}
          isLastPage={currentPage === totalPages}
          onPressNext={onPressNext}
          onPressPrevious={onPressPrevious}
          onKeyPress={onKeyPress}
          onSelectChange={onPaginationChanged}
          pages={totalPages}
          variant="input"
        />
      </Stack>
    </>
  )
}

export default IssuesListController
