/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
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
} from "@cloudoperators/juno-ui-components"
import {
  useFilterLabels,
  useFilterLabelValues,
  useFilterActions,
  useActiveFilters,
  useSearchTerm,
} from "../../hooks/useAppStore"
import { humanizeString } from "../../lib/utils"

const FilterSelect = ({ entityName, isLoading }) => {
  const [filterLabel, setFilterLabel] = useState("")
  const [filterValue, setFilterValue] = useState("")

  const { addActiveFilter, clearActiveFilters, setSearchTerm } =
    useFilterActions()

  const filterLabels = useFilterLabels(entityName)
  const filterLabelValues = useFilterLabelValues(entityName)
  const activeFilters = useActiveFilters(entityName)
  const searchTerm = useSearchTerm()

  const handleFilterAdd = (value) => {
    if (filterLabel && (filterValue || value)) {
      // Add the active filter to the store
      addActiveFilter(entityName, filterLabel, filterValue || value)
      setFilterValue("") // Reset filter value after adding
    }
  }

  const handleFilterLabelChange = (label) => {
    setFilterLabel(label)
  }

  const handleFilterValueChange = (value) => {
    setFilterValue(value)
    handleFilterAdd(value)
  }

  // TODO: The live search should be implemented after having store update mechanism in place
  /*const handleSearchChange = (value) => {
    // Debounce search term to avoid unnecessary re-renders
    const debouncedSearchTerm = setTimeout(() => {
      setSearchTerm(entityName, value.target.value)
    }, 500) 
    return () => clearTimeout(debouncedSearchTerm)
  }*/

  return (
    <Stack alignment="center" gap="8">
      <InputGroup>
        <Select
          name="filter"
          className="filter-label-select w-64 mb-0"
          label="Filter"
          value={humanizeString(filterLabel)}
          onChange={(val) => handleFilterLabelChange(val)}
          disabled={isLoading}
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
          disabled={!filterLabelValues[filterLabel]?.length}
          loading={filterLabelValues[filterLabel]?.isLoading}
          className="filter-value-select w-96 bg-theme-background-lvl-0"
        >
          {filterLabelValues[filterLabel] //Ensure already selected values are not displayed in filterValue drop down to avoid duplicate selections
            ?.filter((value) => !activeFilters[filterLabel]?.includes(value)) // Filter out values that are already active
            .map((value) => (
              <SelectOption value={value} key={value} />
            ))}
        </Select>
        <Button icon="filterAlt" className="py-[0.3rem]" />
      </InputGroup>
      {activeFilters && Object.keys(activeFilters).length > 0 && (
        <Button
          label="Clear all"
          onClick={() => clearActiveFilters(entityName)}
          variant="subdued"
        />
      )}
      {entityName === "IssueMatches" && (
        <SearchInput
          placeholder="Search term or regular expression"
          className="w-96 ml-auto"
          value={searchTerm || ""}
          onSearch={(value) => setSearchTerm(entityName, value)}
          onClear={() => setSearchTerm(null)}
          // onChange={(value) => handleSearchChange(value)}
        />
      )}
    </Stack>
  )
}

export default FilterSelect
