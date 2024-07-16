/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import {
  useActiveFilters,
  useFilterActions,
  usePausedFilters,
} from "../../hooks/useAppStore"

const FilterPills = () => {
  const activeFilters = useActiveFilters()
  const pausedFilter = usePausedFilters()
  const {
    removeActiveFilter,
    addPausedFilter,
    addActiveFilter,
    removePausedFilter,
  } = useFilterActions()

  const pauseFilter = (key, value) => {
    removeActiveFilter(key, value)
    addPausedFilter(key, value)
  }

  const activateFilter = (key, value) => {
    removePausedFilter(key, value)
    addActiveFilter(key, value)
  }

  return (
    <Stack gap="2" wrap={true}>
      {Object.entries(activeFilters).map(([key, values]) => {
        return values.map((value) => (
          <Pill
            pillKey={key}
            pillValue={value}
            closeable
            onClose={() => removeActiveFilter(key, value)}
            key={`${key}:${value}`}
            onClick={() => pauseFilter(key, value)}
          />
        ))
      })}
      {Object.entries(pausedFilter).map(([key, values]) => {
        console.log("sdfsdf", values)
        return values.map((value) => (
          <Pill
            className="bg-theme-background-lvl-4 opacity-70	"
            pillKey={key}
            pillValue={value}
            closeable
            onClose={() => removePausedFilter(key, value)}
            key={`${key}:${value}`}
            onClick={() => activateFilter(key, value)}
          />
        ))
      })}
    </Stack>
  )
}

export default FilterPills
