/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import {
  useActiveFilters,
  usePausedFilters,
  useFilterActions,
  useFilterPills,
} from "../../hooks/useAppStore"

const FilterPills = () => {
  const activeFilters = useActiveFilters()
  const pausedFilters = usePausedFilters()
  const filters = useFilterPills()
  const {
    removeActiveFilter,
    addActiveFilter,
    addPausedFilter,
    removePausedFilter,
  } = useFilterActions()

  const pauseFilter = (key, value) => {
    addPausedFilter(key, value)
  }

  const deleteFilter = (key, value) => {
    removeActiveFilter(key, value)
    removePausedFilter(key, value)
  }

  const activateFilter = (key, value) => {
    addActiveFilter(key, value)
    removePausedFilter(key, value)
  }

  return (
    <Stack gap="2" wrap={true}>
      {Object.entries(activeFilters).map(([key, filterItems]) => {
        return filterItems.map(
          (item) => (
            <Pill
              pillKey={key}
              pillValue={item}
              closeable
              onClose={() => deleteFilter(key, item)}
              key={`${key}:${item.value}`}
              onClick={() => pauseFilter(key, item)}
            />
          )
          //  : (
          //   <Pill
          //     className="bg-theme-background-lvl-4 opacity-70	"
          //     pillKey={key}
          //     pillValue={item.value}
          //     closeable
          //     onClose={() => deleteFilter(key, item.value)}
          //     key={`${key}:${item.value}`}
          //     onClick={() => activateFilter(key, item.value)}
          //   />
          // )
        )
      })}
    </Stack>
  )
}

export default FilterPills
