/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useQueryClientFnReady,
  useQueryOptions,
  useActions,
} from "../StoreProvider"
import ComponentsList from "./ComponentsList"
import {
  Pagination,
  Container,
  Stack,
} from "@cloudoperators/juno-ui-components"
import {
  Messages,
  useActions as messageActions,
} from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"

const ComponentsListController = () => {
  const queryClientFnReady = useQueryClientFnReady()
  const queryOptions = useQueryOptions("components")
  const { setQueryOptions } = useActions()
  const { addMessage, resetMessages } = messageActions()

  const { isLoading, isFetching, isError, data, error } = useQuery({
    queryKey: [`components`, queryOptions],
    enabled: !!queryClientFnReady,
  })

  const [currentPage, setCurrentPage] = useState(1) // State for current page

  const components = useMemo(() => {
    if (!data) return null
    return data?.Components?.edges
  }, [data])

  useEffect(() => {
    if (!error) return resetMessages()
    addMessage({
      variant: "error",
      text: parseError(error),
    })
  }, [error])

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.Components?.pageInfo
  }, [data])

  const totalPages = useMemo(() => {
    if (!data?.Components?.pageInfo?.pages) return 0
    return data?.Components?.pageInfo?.pages.length
  }, [data?.Components?.pageInfo])
  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage) // Update currentPage
    if (!data?.Components?.pageInfo?.pages) return
    const pages = data?.Components?.pageInfo?.pages
    const currentPageIndex = pages?.findIndex(
      (page) => page?.pageNumber === parseInt(newPage)
    )
    if (currentPageIndex > -1) {
      const after = pages[currentPageIndex]?.after
      setQueryOptions("components", {
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
        <ComponentsList components={components} isLoading={isLoading} />
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

export default ComponentsListController
