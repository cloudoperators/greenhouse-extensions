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
} from "../../hooks/useAppStore"
import {
  Pagination,
  Container,
  Stack,
} from "@cloudoperators/juno-ui-components"
import { useActions as messageActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"

const reformatFilters = (filters) => {
  const reformattedFilters = {}

  for (const key in filters) {
    // Split the key into words based on spaces
    let newKey = key
      .split(" ")
      .map((word, index) => {
        if (index === 0) {
          // Only change the first letter of the first word to lowercase if it's not already lowercase
          return word.charAt(0).toLowerCase() + word.slice(1)
        } else {
          // Capitalize the first letter of subsequent words only if they are not already capitalized
          return word.charAt(0) === word.charAt(0).toUpperCase()
            ? word
            : word.charAt(0).toUpperCase() + word.slice(1)
        }
      })
      .join("")

    // Add the reformatted filter to the new structure
    reformattedFilters[newKey] = filters[key]
  }

  return { filter: reformattedFilters }
}

const ListController = ({ queryKey, entityName, ListComponent }) => {
  const queryClientFnReady = useGlobalsQueryClientFnReady()
  const queryOptions = useGlobalsQueryOptions(queryKey)
  const { setQueryOptions } = useGlobalsActions()
  const { addMessage, resetMessages } = messageActions()
  const activeFilters = useActiveFilters()

  const { isLoading, data, error } = useQuery({
    queryKey: [
      queryKey,
      { ...queryOptions, ...reformatFilters(activeFilters) },
    ],
    enabled: !!queryClientFnReady,
  })

  const [currentPage, setCurrentPage] = useState(1)

  const items = useMemo(() => {
    if (!data) return null
    return data?.[entityName]?.edges
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
    if (!data?.[entityName]?.pageInfo?.pages) return 0
    return data?.[entityName]?.pageInfo?.pages.length
  }, [data?.[entityName]?.pageInfo])

  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage)
    if (!data?.[entityName]?.pageInfo?.pages) return
    const pages = data?.[entityName]?.pageInfo?.pages
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
        <ListComponent items={items} isLoading={isLoading} />
      </Container>
      <Stack className="flex justify-end">
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

export default ListController
