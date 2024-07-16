/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import { useActiveFilters, useFilterActions } from "../../hooks/useAppStore"

const FilterPills = () => {
  const activeFilters = useActiveFilters()
  const [filters, setFilters] = useState({})
  const { removeActiveFilter } = useFilterActions()

  // useEffect Hook zur Aktualisierung der Filter
  useEffect(() => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }

      for (let key in newFilters) {
        if (newFilters.hasOwnProperty(key)) {
          if (activeFilters[key]) {
            const activeSet = new Set(activeFilters[key])

            // Behalte inaktive Elemente und aktualisiere aktive
            newFilters[key] = newFilters[key].map((item) => {
              if (activeSet.has(item.value)) {
                return { ...item, active: true }
              }
              return item // Behalte inaktive Elemente unverändert
            })

            // Füge neue aktive Elemente hinzu
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
    })
    console.log(filters)
  }, [activeFilters])

  const pauseFilter = (key, value) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      if (newFilters[key]) {
        newFilters[key] = newFilters[key].map((item) =>
          item.value === value ? { ...item, active: false } : item
        )
      }
      return newFilters
    })

    // Optional: Aktualisiere auch activeFilters
    removeActiveFilter(key, value)
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
            className="bg-theme-background-lvl-4"
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
