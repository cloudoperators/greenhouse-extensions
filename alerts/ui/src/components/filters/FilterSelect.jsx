/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react"

import {
  Button,
  InputGroup,
  SelectOption,
  Select,
  Stack,
  SearchInput,
} from "juno-ui-components"
import {
  useFilterLabels,
  useFilterLabelValues,
  useFilterActions,
  useActiveFilters,
  useSearchTerm,
} from "../../hooks/useAppStore"
import { humanizeString } from "../../lib/utils"

const FilterSelect = () => {
  const [filterLabel, setFilterLabel] = useState("")
  const [filterValue, setFilterValue] = useState("")
  const [resetKey, setResetKey] = useState(Date.now())

  const {
    addActiveFilter,
    loadFilterLabelValues,
    clearActiveFilters,
    setSearchTerm,
  } = useFilterActions()
  const filterLabels = useFilterLabels()
  const filterLabelValues = useFilterLabelValues()
  const activeFilters = useActiveFilters()
  const searchTerm = useSearchTerm()

  const handleFilterAdd = (value) => {
    if (filterLabel && (filterValue || value)) {
      // add active filter to store
      addActiveFilter(filterLabel, filterValue || value)

      // reset filterValue
      setFilterValue("")
    } else {
      // TODO: show error -> please select filter/value
    }
  }

  const handleFilterLabelChange = (value) => {
    setFilterLabel(value)
    // lazy loading of all possible values for this label (only load them if we haven't already)
    if (!filterLabelValues[value]?.values) {
      loadFilterLabelValues(value)
    }
  }

  const handleFilterValueChange = (value) => {
    setFilterValue(value)
    handleFilterAdd(value)
  }

  const handleSearchChange = (value) => {
    // debounce setSearchTerm to avoid unnecessary re-renders
    const debouncedSearchTerm = setTimeout(() => {
      setSearchTerm(value.target.value)
    }, 500)

    // clear timeout if we have a new value
    return () => clearTimeout(debouncedSearchTerm)
  }

  // const handleKeyDown = (event) => {
  //   if (event.key === "Enter") {
  //     handleFilterValueChange()
  //   }
  // }

  return (
    <Stack alignment="center" gap="8">
      <InputGroup>
        <Select
          name="filter"
          className="filter-label-select w-64 mb-0"
          label="Filter"
          value={filterLabel}
          onChange={(val) => handleFilterLabelChange(val)}
        >
          {filterLabels?.map((filter) => (
            <SelectOption
              value={filter}
              label={humanizeString(filter)}
              key={filter}
            />
          ))}
        </Select>
        <Select
          name="filterValue"
          value={filterValue}
          onChange={(value) => handleFilterValueChange(value)}
          disabled={filterLabelValues[filterLabel] ? false : true}
          loading={filterLabelValues[filterLabel]?.isLoading}
          className="filter-value-select w-96 bg-theme-background-lvl-0"
          key={resetKey}
        >
          {filterLabelValues[filterLabel]?.values
            ?.filter(
              (value) =>
                // filter out already active values for this label
                !activeFilters[filterLabel]?.includes(value)
            )
            .map((value) => (
              <SelectOption value={value} key={value} />
            ))}
        </Select>
        <Button
          onClick={() => handleFilterAdd()}
          icon="filterAlt"
          className="py-[0.3rem]"
        />
      </InputGroup>
      {activeFilters && Object.keys(activeFilters).length > 0 && (
        <Button
          label="Clear all"
          onClick={() => clearActiveFilters()}
          variant="subdued"
        />
      )}
      <SearchInput
        placeholder="search term or regular expression"
        className="w-96 ml-auto"
        value={searchTerm || ""}
        onSearch={(value) => setSearchTerm(value)}
        onClear={() => setSearchTerm(null)}
        onChange={(value) => handleSearchChange(value)}
      />
    </Stack>
  )
}

export default FilterSelect
