/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react"
import {
  Button,
  InputGroup,
  SelectOption,
  Select,
  Stack,
  SearchInput,
} from "@cloudoperators/juno-ui-components"
import {
  useFilterLabelValues,
  useActions,
  useActiveFilters,
  useSearchTerm,
} from "../StoreProvider"
import { humanizeString } from "../../lib/utils"

const FilterSelect = ({ filters }) => {
  const [filterLabel, setFilterLabel] = useState("")
  const [filterValue, setFilterValue] = useState("")
  const [resetKey, setResetKey] = useState(Date.now())

  const {
    addActiveFilter,
    fetchFilterValues,
    clearActiveFilters,
    setSearchTerm,
  } = useActions()
  const filterLabelValues = useFilterLabelValues()
  const activeFilters = useActiveFilters()
  const searchTerm = useSearchTerm()

  const handleFilterAdd = (value) => {
    if (filterLabel && (filterValue || value)) {
      addActiveFilter(filterLabel, filterValue || value)
      setFilterValue("")
    } else {
      // TODO: show error -> please select filter/value
    }
  }

  const handleFilterLabelChange = (value) => {
    setFilterLabel(value)
    if (!filterLabelValues[value]?.values) {
      fetchFilterValues(value)
    }
  }

  const handleFilterValueChange = (value) => {
    setFilterValue(value)
    handleFilterAdd(value)
  }

  const handleSearchChange = (value) => {
    const debouncedSearchTerm = setTimeout(() => {
      setSearchTerm(value.target.value)
    }, 500)
    return () => clearTimeout(debouncedSearchTerm)
  }

  useEffect(() => {
    // Load initial filter labels from the filters prop
    setFilterLabel("")
  }, [filters])

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
          {filters?.map((filter) => (
            <SelectOption
              value={filter.label}
              label={humanizeString(filter.label)}
              key={filter.label}
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
            ?.filter((value) => !activeFilters[filterLabel]?.includes(value))
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
