/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useGlobalsQueryClientFnReady,
  useGlobalsQueryOptions,
  useGlobalsActions,
  useActiveFilters,
  usePredefinedFilters,
  useGlobalsActiveTab,
  useSearchTerm,
} from "../../hooks/useAppStore"
import {
  Pagination,
  Container,
  Stack,
} from "@cloudoperators/juno-ui-components"
import { useActions as messageActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"

const ListController = ({ queryKey, entityName, ListComponent }) => {
  const queryClientFnReady = useGlobalsQueryClientFnReady()
  const queryOptions = useGlobalsQueryOptions(queryKey)
  const { setQueryOptions } = useGlobalsActions()
  const { addMessage, resetMessages } = messageActions()
  const activeTab = useGlobalsActiveTab()
  const activeFilters = useActiveFilters(entityName)
  const predefinedFilters = usePredefinedFilters(entityName)
  const searchTerm = useSearchTerm(entityName)

  const { isLoading, data, error } = useQuery({
    queryKey: [
      queryKey,
      {
        ...queryOptions,
        filter: {
          ...activeFilters,
          ...predefinedFilters,
          ...(entityName === "IssueMatches" && {
            // Currently search is only available for IssueMatches entity.
            search: Array.isArray(searchTerm) ? searchTerm : [searchTerm], // Ensure searchTerm is an array
          }),
        },
      },
    ],
    enabled: !!queryClientFnReady && queryKey === activeTab,
  })

  const [currentPage, setCurrentPage] = useState(1)

  const items = useMemo(() => {
    if (!data) return null
    return data?.[entityName]?.edges || []
  }, [data, entityName])

  useEffect(() => {
    if (!error) return resetMessages()
    addMessage({
      variant: "error",
      text: parseError(error),
    })
  }, [error])

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.[entityName]?.pageInfo
  }, [data, entityName])

  const totalPages = useMemo(() => {
    if (!pageInfo?.pages) return 0
    return pageInfo.pages.length
  }, [pageInfo])

  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage)
    if (!pageInfo?.pages) return
    const pages = pageInfo.pages
    const currentPageIndex = pages?.findIndex(
      (page) => page?.pageNumber === parseInt(newPage)
    )
    if (currentPageIndex > -1) {
      const after = pages[currentPageIndex]?.after
      setQueryOptions(queryKey, {
        ...queryOptions,
        after: `${after}`,
      })
    }
  }

  return (
    <>
      <Container py>
        <ListComponent items={items} isLoading={isLoading} />
      </Container>
      <Stack className="flex justify-end">
        <Pagination
          currentPage={currentPage}
          isFirstPage={currentPage === 1}
          isLastPage={currentPage === totalPages}
          onPressNext={() => onPaginationChanged(currentPage + 1)}
          onPressPrevious={() => onPaginationChanged(currentPage - 1)}
          onKeyPress={(oKey) => {
            if (oKey.code === "Enter") {
              onPaginationChanged(parseInt(oKey.currentTarget.value))
            }
          }}
          onSelectChange={onPaginationChanged}
          pages={totalPages}
          variant="input"
        />
      </Stack>
    </>
  )
}

export default ListController
