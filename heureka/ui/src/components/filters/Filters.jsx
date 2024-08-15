/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Stack } from "@cloudoperators/juno-ui-components"
import {
  useGlobalsQueryClientFnReady,
  useFilterActions,
} from "../../hooks/useAppStore"
import FilterSelect from "./FilterSelect"
import FilterPills from "./FilterPills"

const filtersStyles = `
  bg-theme-background-lvl-1
  py-2
  px-4
  my-px
`

const Filters = ({ queryKey }) => {
  const queryClientFnReady = useGlobalsQueryClientFnReady()
  const { setLabels, setFilterLabelValues } = useFilterActions()

  const { isLoading, data } = useQuery({
    queryKey: [queryKey],
    enabled: !!queryClientFnReady && !!queryKey,
  })

  const filters = useMemo(() => {
    if (!data || !data.ServiceFilterValues) return []

    return Object.keys(data.ServiceFilterValues).map((key) => {
      const field = data.ServiceFilterValues[key]
      return {
        label: field.filterName,
        values: field.values,
      }
    })
  }, [data])
  console.log("filters: ", filters)

  const filterLabels = useMemo(() => {
    return filters.map((filter) => filter.label)
  }, [filters])

  setLabels(filterLabels)
  setFilterLabelValues(filters)

  return (
    <Stack direction="vertical" gap="4" className={`filters ${filtersStyles}`}>
      <FilterSelect isLoading={isLoading} />
      <FilterPills />
    </Stack>
  )
}

export default Filters
