/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useCallback } from "react"
import { Filters, FilterPill } from "juno-ui-components"
import { useStore } from "./FilterToolbarStore"

const toURLOptions = (items) => {
  let options = []
  items.forEach((item) => {
    options.push({ [item.key]: item.value })
  })
  return options
}

// onSearchTerm (callback): returns key:value selected filters, ex: {name: "Elektra"}
// isLoading (boolean): sets the tool in loading state
// filterLabels (object): labels matching the filter key to be displayed in the dropdown. Ex: {name: "service name"}
// placeholders (object): placeholders matching the selected key
const FilterToolbarCore = ({
  onSearchTerm,
  isLoading,
  filterLabels,
  placeholders,
}) => {
  const selectedFilters = useStore(useCallback((state) => state.filters))
  const filterTypes = useStore(useCallback((state) => state.filterTypes))
  const addFilter = useStore((state) => state.addFilter)
  const removeFilter = useStore((state) => state.removeFilter)

  const [placeholder, setPlaceholder] = useState("")
  const [filterKey, setFilterKey] = useState("")
  const [error, setError] = useState(null)

  const filterOptions = useMemo(() => {
    if (typeof filterTypes !== "object") return []
    let result = []
    Object.keys(filterTypes).forEach((key) => {
      // check if there is a label for the key
      const label =
        filterLabels && typeof filterLabels === "object" && filterLabels[key]
      result.push({ label: label || key, key: key })
    })
    return result
  }, [filterTypes, filterLabels])

  useEffect(() => {
    onSearchTerm(toURLOptions(selectedFilters))
  }, [selectedFilters])

  const onSelectChange = (event) => {
    const selectedValue = event.target.value
    let label = `Please enter ${selectedValue}`
    if (placeholders && placeholders[selectedValue]) {
      label = placeholders[selectedValue]
    }
    // save the selected key
    setFilterKey(selectedValue)
    // set the new placeholder
    setPlaceholder(label)
  }

  const onPillClosed = (uid) => {
    removeFilter(uid)
  }

  const onFilter = (value) => {
    setError(null)
    if (filterKey === "") {
      return setError("Please select a filter type")
    }
    if (value === "") {
      return setError("Filter value can't be blank")
    }
    addFilter(filterKey, value)
  }

  return (
    <Filters
      filters={{
        label: "Select a Filter",
        options: filterOptions,
      }}
      valuePlaceholder={placeholder}
      loading={isLoading}
      onFilter={onFilter}
      onSelectedFilterKeyChange={onSelectChange}
    >
      {selectedFilters.map((item, index) => (
        <FilterPill
          key={index}
          uid={item.uid}
          filterKey={item.key}
          filterValue={item.value}
          onClose={onPillClosed}
        />
      ))}
      {error && (
        <div className="basis-full">
          <span className="text-theme-danger">{error}</span>
        </div>
      )}
    </Filters>
  )
}

export default FilterToolbarCore
