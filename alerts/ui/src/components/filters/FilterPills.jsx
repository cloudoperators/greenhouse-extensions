/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

<<<<<<< HEAD
import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import { useActiveFilters, useFilterActions } from "../../hooks/useAppStore"

const FilterPills = () => {
  const activeFilters = useActiveFilters()
  const [filters, setFilters] = useState({})
  const { removeActiveFilter } = useFilterActions()

=======
import { Pill, Stack } from "juno-ui-components"
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
>>>>>>> c43f24a (feat(alerts/ui): clear all button clears now also inactive Filters.)
  // useEffect Hook zur Aktualisierung der Filter
  useEffect(() => {
    const pills = (prevFilters) => {
      const newFilters = { ...prevFilters }

      for (let key in newFilters) {
        if (newFilters.hasOwnProperty(key)) {
          if (activeFilters[key]) {
            const activeSet = new Set(activeFilters[key])

            newFilters[key] = newFilters[key].map((item) => {
              if (activeSet.has(item.value)) {
                return { ...item, active: true }
              }
              return item
            })

            activeFilters[key].forEach((value) => {
              if (!newFilters[key].some((item) => item.value === value)) {
                newFilters[key].push({ value, active: true })
              }
            })
          }
        }
      }

      // Hinzufügen neuer Kategorien aus activeFilters
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

    //  Aktualisiere auch activeFilters
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
    // aktualisiere active Filters
    addActiveFilter(key, value)
  }

  return (
    <Stack gap="2" wrap={true}>
<<<<<<< HEAD
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
            className="bg-theme-background-lvl-4"
            pillKey={key}
            pillValue={value}
            closeable
            onClose={() => removePausedFilter(key, value)}
            key={`${key}:${value}`}
            onClick={() => activateFilter(key, value)}
          />
        ))
=======
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
>>>>>>> 6811992 (feat(alerts/ui): delete specific paused filters)
      })}
    </Stack>
  )
}

export default FilterPills
