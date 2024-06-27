/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Stack } from "juno-ui-components"
import { useQueryClientFnReady, useActions } from "../StoreProvider"
import FilterSelect from "./FilterSelect"
import FilterPills from "./FilterPills"

const filtersStyles = `
  bg-theme-background-lvl-1
  py-2
  px-4
  my-px
`

const Filters = ({ queryKey }) => {
  const queryClientFnReady = useQueryClientFnReady()
  const { addActiveFilter } = useActions()

  const { isLoading, isFetching, isError, data, error } = useQuery({
    queryKey: [queryKey],
    enabled: !!queryClientFnReady && !!queryKey,
  })

  const filters = useMemo(() => {
    if (!data) return []
    return data?.__type?.inputFields?.map((field) => ({
      label: field?.name,
      kind: field?.type?.kind,
      ofType: field?.type?.ofType?.name,
      enumValues: field?.type?.ofType?.enumValues,
    }))
  }, [data])

  // Set default filter for SupportGroupName
  useMemo(() => {
    if (filters?.length > 0) {
      const supportGroupFilter = filters.find(
        (f) => f.label === "supportGroupName"
      )
      if (supportGroupFilter) {
        addActiveFilter(
          "supportGroupName",
          supportGroupFilter.enumValues[0]?.name
        )
      }
    }
  }, [filters, addActiveFilter])

  return (
    <Stack direction="vertical" gap="4" className={`filters ${filtersStyles}`}>
      <FilterSelect isLoading={isLoading} filters={filters} />
      <FilterPills />
    </Stack>
  )
}

export default Filters
