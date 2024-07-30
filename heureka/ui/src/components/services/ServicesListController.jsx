/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useQueryClientFnReady,
  useQueryOptions,
  useActions,
} from "../StoreProvider"
import { Pagination } from "@cloudoperators/juno-ui-components"
import ServicesList from "./ServicesList"
import { Messages, useActions as messageActions } from "messages-provider"

const ServicesListController = () => {
  const { addMessage, resetMessages } = messageActions()
  const queryClientFnReady = useQueryClientFnReady()
  const queryOptions = useQueryOptions("services")
  const { setQueryOptions } = useActions()

  const { isLoading, isFetching, isError, data, error } = useQuery({
    queryKey: [`services`, queryOptions],
    enabled: !!queryClientFnReady,
  })

  const services = useMemo(() => {
    // return null so that the component can handle the loading state at the beginning
    if (!data) return null
    return data?.Services?.edges
  }, [data])

  useEffect(() => {
    if (!error) return
    addMessage({ variant: "danger", text: error?.message })
  }, [error])

  const [currentPage, setCurrentPage] = useState(1) // State for current page

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.Services?.pageInfo
  }, [data])

  const totalPages = useMemo(() => {
    if (!data?.Services?.pageInfo?.pages) return 0
    return data?.Services?.pageInfo?.pages.length
  }, [data?.Services?.pageInfo])

  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage) // Update currentPage
    if (!data?.Services?.pageInfo?.pages) return
    const pages = data?.Services?.pageInfo?.pages
    const currentPageIndex = pages?.findIndex(
      (page) => page?.pageNumber === parseInt(newPage)
    )
    if (currentPageIndex > -1) {
      const after = pages[currentPageIndex]?.after
      setQueryOptions("services", {
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
      <ServicesList services={services} isLoading={isLoading} />
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
    </>
  )
}

export default ServicesListController
