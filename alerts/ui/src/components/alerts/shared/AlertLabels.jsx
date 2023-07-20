import React from "react"

import { Pill, Stack } from "juno-ui-components"

import {
  useActiveFilters,
  useFilterLabels,
  useFilterActions,
} from "../../../hooks/useAppStore"

/**
 * For each of the given alert's labels which is included in the configured filterLabels render a Pill showing filterLabel and filterValue
 */
const AlertLabels = ({ alert, showAll}) => {
  const filterLabels = showAll ? Object.keys(alert?.labels) : useFilterLabels()
  const activeFilters = useActiveFilters()
  const { addActiveFilter, removeActiveFilter } = useFilterActions()

  const handleLabelClick = (e, filterLabel, filterValue) => {
    // handle event only if the Pill is not already active
    if (!activeFilters?.[filterLabel]?.includes(value)) {
      e.stopPropagation()
      addActiveFilter(filterLabel, filterValue)
    }
  }

  const handleRemoveFilter = (e, filterLabel, filterValue) => {
    e.stopPropagation()
    removeActiveFilter(filterLabel, filterValue)
  }

  return (
    <Stack gap="2" alignment="start" wrap={true}>
      {filterLabels.map((filterLabel) => {
        let value = alert?.labels?.[filterLabel]
        let isActive = activeFilters?.[filterLabel]?.includes(value)

        return (
          value && (
              <Pill
                key={filterLabel}
                pillKey={filterLabel}
                pillValue={value}
                onClick={(e, _) => handleLabelClick(e, filterLabel, value)}
                closeable={isActive}
                onClose={(e, _) => handleRemoveFilter(e, filterLabel, value)}
              />
          )
        )
      })}
    </Stack>
  )
}

export default AlertLabels
