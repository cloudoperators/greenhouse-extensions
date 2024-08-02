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
  useActiveFilters,
  useFilteredServices,
  useEndpoint,
} from "../StoreProvider"
import {
  Pagination,
  Container,
  Stack,
} from "@cloudoperators/juno-ui-components"
import ServicesList from "./ServicesList"
import {
  Messages,
  useActions as messageActions,
} from "@cloudoperators/juno-messages-provider"
import { getFilterValues } from "../../queries"

const ServicesListController = () => {
  const { addMessage, resetMessages } = messageActions()
  const queryClientFnReady = useQueryClientFnReady()
  const queryOptions = useQueryOptions("services")
  const { setQueryOptions, fetchServices } = useActions()
  const filters = useActiveFilters()
  const endpoint = useEndpoint()
  // const services = useFilteredServices()

  // const { isLoading, isFetching, isError, data, error } = useQuery({
  //   queryKey: [`services`, { ...queryOptions, filter: filters }],
  //   enabled: !!queryClientFnReady,
  // })
  const { data, error, isLoading } = getFilterValues(
    "supportGroupName",
    queryOptions.bearerToken,
    endpoint
  )

  useEffect(() => {
    if (!error) return
    addMessage({ variant: "danger", text: error?.message })
  }, [error])

  const [currentPage, setCurrentPage] = useState(1)

  const services = useMemo(() => {
    if (!data) return null
    return data?.Services?.edges
  }, [data])

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.Services?.pageInfo
  }, [data])

  const totalPages = useMemo(() => {
    if (!data?.Services?.pageInfo?.pages) return 0
    return data?.Services?.pageInfo?.pages.length
  }, [data?.Services?.pageInfo])

  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage)
    if (!data?.Services?.pageInfo?.pages) return
    const pages = data?.Services?.pageInfo?.pages
    const currentPageIndex = pages?.findIndex(
      (page) => page?.pageNumber === parseInt(newPage)
    )
    if (currentPageIndex > -1) {
      const after = pages[currentPageIndex]?.after
      setQueryOptions("services", {
        ...queryOptions,
        filter: filters,
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
        <ServicesList services={services} isLoading={isLoading} />
      </Container>
      <Stack className="flex justify-end">
        <Pagination
          currentPage={currentPage}
          isFirstPage={currentPage === 1}
          isLastPage={currentPage === totalPages}
          onPressNext={onPressNext}
          onPressPrevious={onPressPrevious}
          onKeyPress={onKeyPress}
          onChange={onPaginationChanged}
          totalPages={totalPages}
          hasPageInfo={!!pageInfo}
        />
      </Stack>
    </>
  )
}

export default ServicesListController
