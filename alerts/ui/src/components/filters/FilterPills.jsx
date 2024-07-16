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

    //  Aktualisiere auch activeFilters
    removeActiveFilter(key, value)
  }

  const removeValue = (key, value) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }

      if (newFilters[key]) {
        newFilters[key] = newFilters[key].filter((item) => item.value !== value)

        // Entferne die Kategorie, wenn sie leer ist
        if (newFilters[key].length === 0) {
          delete newFilters[key]
        }
      }

      return newFilters
    })
  }

  const activateFilter = (key, value) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      if (newFilters[key]) {
        newFilters[key] = newFilters[key].map((item) =>
          item.value === value ? { ...item, active: true } : item
        )
      }
      return newFilters
    })
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
              onClose={() => removeActiveFilter(key, item.value)}
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
