import React, { useState } from "react"

import {
  Button,
  InputGroup,
  Select,
  SelectOption,
  SelectRow,
  Stack,
} from "juno-ui-components"
import { useFilterLabels, useFilterLabelValues, useFilterActions, useActiveFilters } from "../../hooks/useStore"
import { humanizeString } from "../../lib/utils"


const FilterSelect = () => {
  const [filterLabel, setFilterLabel] = useState()
  const [filterValue, setFilterValue] = useState()
  const [resetKey, setResetKey] = useState(Date.now())

  const { addActiveFilter, loadFilterLabelValues, clearActiveFilters } = useFilterActions()
  const filterLabels = useFilterLabels() 
  const filterLabelValues = useFilterLabelValues()
  const activeFilters = useActiveFilters()

  const handleFilterAdd = (value) => {
    
    if (filterLabel && (filterValue || value)) {
      // add active filter to store
      addActiveFilter(filterLabel, (filterValue || value))

      // reset filterValue
      setFilterValue(undefined)
      // force key change to reset the Select component to its initial state
      // so that the placeholder is rendered again. This is a workaround to fix an open issue 
      // in Radix UI. See: https://github.com/radix-ui/primitives/issues/1569
      setResetKey(Date.now())

      // TODO: remove filterValue from available value list
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

  // const handleKeyDown = (event) => {
  //   if (event.key === "Enter") {
  //     handleFilterValueChange()
  //   } 
  // }

  return (
    <Stack alignment="center" gap="8">
      <InputGroup>
        <SelectRow
          name="filter"
          className="filter-label-select w-64 mb-0"
          label="Filter"
          value={filterLabel}
          onValueChange={(val) => handleFilterLabelChange(val)}
        >
          {filterLabels?.map((filterLabel) => (
            <SelectOption
              value={filterLabel}
              label={humanizeString(filterLabel)}
              key={filterLabel}
            />
          ))}
        </SelectRow>
        <Select
          name="filterValue"
          value={filterValue}
          onValueChange={(value) => handleFilterValueChange(value)}
          disabled={filterLabelValues[filterLabel] ? false : true}
          loading={filterLabelValues[filterLabel]?.isLoading}
          className="filter-value-select w-96 bg-theme-background-lvl-1"
          key={resetKey}
        >
          { filterLabelValues[filterLabel]?.values?.filter((value) =>
              // filter out already active values for this label
              !activeFilters[filterLabel]?.includes(value)
            ).map((value) =>
            <SelectOption
              value={value}
              key={value}
            />
          )}
        </Select>
        <Button
          onClick={() => handleFilterAdd()}
          icon="filterAlt"
          className="py-[0.3rem]"
        />
      </InputGroup>
      {activeFilters && Object.keys(activeFilters).length > 0 &&
        <Button
          label="Clear all filters"
          onClick={() => clearActiveFilters()}
          variant="subdued"
        />
      }
    </Stack>
  )
}

export default FilterSelect
