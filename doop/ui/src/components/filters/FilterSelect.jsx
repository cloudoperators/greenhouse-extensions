/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react"

import {
  Button,
  InputGroup,
  SearchInput,
  Select,
  SelectOption,
  Stack,
} from "@cloudoperators/juno-ui-components"

import {
  useFiltersActions,
  useFiltersSearchTerm,
  useFiltersActive,
  useDataFilterEntries,
} from "../StoreProvider"

const FilterSelect = () => {
  const [selectedCategory, selectCategory] = useState("")
  const [selectedValue, selectValue] = useState("")
  const [resetKey, setResetKey] = useState(Date.now())
  const filterEntries = useDataFilterEntries()

  const { add: addFilter, removeAll, setSearchTerm } = useFiltersActions()
  const searchValue = useFiltersSearchTerm()
  const activeFilters = useFiltersActive() || []

  const handleFilterValueChange = (value) => {
    selectValue(null)
    if (value !== null) addFilter(selectedCategory, value)
    // force key change to reset the Select component to its initial state
    // so that the placeholder is rendered again. This is a workaround to fix an open issue
    // in Radix UI. See: https://github.com/radix-ui/primitives/issues/1569
    setResetKey(Date.now())
  }

  const handleSearchChange = (value) => {
    // debounce setSearchTerm to avoid unnecessary re-renders
    const debouncedSearchTerm = setTimeout(() => {
      setSearchTerm(value.target.value)
    }, 500)

    // clear timeout if we have a new value
    return () => clearTimeout(debouncedSearchTerm)
  }

  return (
    <Stack alignment="center" gap="8" distribution="between">
      <Stack gap="2">
        <InputGroup>
          <Select
            name="category"
            className="filter-label-select w-52 mb-0"
            label="Select category"
            value={selectedCategory}
            onChange={selectCategory}
          >
            {filterEntries.map((entry, i) => (
              <SelectOption value={entry.key} label={entry.label} key={i} />
            ))}
          </Select>
          <Select
            name="value"
            value={selectedValue}
            onChange={(value) => handleFilterValueChange(value)}
            disabled={!selectedCategory}
            className="filter-value-select w-80 bg-theme-background-lvl-0"
            key={resetKey}
          >
            {filterEntries
              .find((e) => e.key === selectedCategory)
              ?.values.map((value, i) => (
                <SelectOption value={value} key={i} />
              ))}
          </Select>
          <Button
            onClick={() =>
              selectedCategory &&
              selectedValue &&
              addFilter(selectedCategory, selectedValue)
            }
            icon="filterAlt"
            className="py-[0.3rem]"
          />
        </InputGroup>
        {activeFilters.length > 0 && (
          <Button label="Clear all" onClick={removeAll} variant="subdued" />
        )}
      </Stack>

      <SearchInput
        className="w-96"
        value={searchValue || ""}
        onChange={(value) => handleSearchChange(value)}
        onClear={() => setSearchTerm(null)}
      />
    </Stack>
  )
}

export default FilterSelect
