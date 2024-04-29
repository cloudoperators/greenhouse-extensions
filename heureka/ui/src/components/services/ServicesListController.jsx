/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useQueryClientFnReady,
  useQueryOptions,
  useActions,
} from "../StoreProvider"
import Pagination from "../shared/Pagination"
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

  const onPaginationChanged = (offset) => {
    setQueryOptions("services", { ...queryOptions, after: `${offset}` })
  }

  return (
    <>
      <ServicesList services={services} isLoading={isLoading} />
      <Pagination
        count={data?.Services?.totalCount}
        limit={queryOptions?.first}
        onChanged={onPaginationChanged}
        isFetching={isFetching}
        disabled={isError || !services || services?.length === 0}
      />
    </>
  )
}

export default ServicesListController
