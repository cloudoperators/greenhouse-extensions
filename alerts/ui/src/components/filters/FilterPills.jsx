/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react"

import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import {
  useActiveFilters,
  useFilterActions,
  useFilterPills,
} from "../../hooks/useAppStore"

const FilterPills = () => {
  const activeFilters = useActiveFilters()
  const filters = useFilterPills()
  const { removeActiveFilter, addActiveFilter, setFilterPills } =
    useFilterActions()
  // useEffect Hook to actualize the filter pills when activeFilters change
  useEffect(() => {
    // Fuction to actualize the filter pills
    const pills = (prevFilters) => {
      const newFilters = { ...prevFilters }

      for (let key in newFilters) {
        if (newFilters.hasOwnProperty(key)) {
          if (activeFilters[key]) {
            const activeSet = new Set(activeFilters[key])

            // Activates the filter pills that are in activeFilters and inactive

            newFilters[key] = newFilters[key].map((item) => {
              if (activeSet.has(item.value)) {
                return { ...item, active: true }
              }
              return item
            })

            // Add new values to filter pills if non existent
            activeFilters[key].forEach((value) => {
              if (!newFilters[key].some((item) => item.value === value)) {
                newFilters[key].push({ value, active: true })
              }
            })
          }
        }
      }

      // Add new keys to activeFilters if non existent
      for (let key in activeFilters) {
        if (!newFilters.hasOwnProperty(key)) {
          newFilters[key] = activeFilters[key].map((value) => ({
            value,
            active: true,
          }))
        }
      }

      return newFilters
    }
    setFilterPills(pills(filters))
    console.log(JSON.stringify(filters))
  }, [activeFilters])

  const pauseFilter = (key, value) => {
    const pills = (filters) => {
      const newFilters = { ...filters }
      if (newFilters[key]) {
        newFilters[key] = newFilters[key].map((item) =>
          item.value === value ? { ...item, active: false } : item
        )
      }
      return newFilters
    }

    setFilterPills(pills(filters))

    // actualize activeFilters
    removeActiveFilter(key, value)
  }

  const deleteFilter = (key, value) => {
    removeValue(key, value)
    removeActiveFilter(key, value)
  }

  const removeValue = (key, value) => {
    const pills = (filters) => {
      const newFilters = { ...filters }

      if (newFilters[key]) {
        newFilters[key] = newFilters[key].filter((item) => item.value !== value)

        // delete empty category
        if (newFilters[key].length === 0) {
          delete newFilters[key]
        }
      }
      return newFilters
    }

    setFilterPills(pills(filters))
  }

  const activateFilter = (key, value) => {
    const pills = (filters) => {
      const newFilters = { ...filters }
      if (newFilters[key]) {
        newFilters[key] = newFilters[key].map((item) =>
          item.value === value ? { ...item, active: true } : item
        )
      }
      return newFilters
    }
    setFilterPills(pills(filters))
    // actualize activeFilters
    addActiveFilter(key, value)
  }

  return (
    <Stack gap="2" wrap={true}>
      {Object.entries(filters).map(([key, filterItems]) => {
        return filterItems.map((item) =>
          item.active ? (
            <Pill
              pillKey={key}
              pillValue={item.value}
              closeable
              onClose={() => deleteFilter(key, item.value)}
              key={`${key}:${item.value}`}
              onClick={() => pauseFilter(key, item.value)}
            />
          ) : (
            <Pill
              className="bg-theme-background-lvl-4 opacity-70	"
              pillKey={key}
              pillValue={item.value}
              closeable
              onClose={() => removeValue(key, item.value)}
              key={`${key}:${item.value}`}
              onClick={() => activateFilter(key, item.value)}
            />
          )
        )
      })}
    </Stack>
  )
}

export default FilterPills
