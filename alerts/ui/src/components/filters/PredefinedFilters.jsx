import React, { useState } from "react"

import { Tabs, TabList, Tab, TabPanel } from "juno-ui-components"
import {
  useActivePredefinedFilter,
  useFilterActions,
  usePredefinedFilters,
} from "../../hooks/useAppStore"

const PredefinedFilters = () => {
  const { setActivePredefinedFilter } = useFilterActions()
  const predefinedFilters = usePredefinedFilters()
  const activePredefinedFilter = useActivePredefinedFilter()

  // find the index of the active predefined filter in the list of predefined filters and set it as the selected index
  const activePredefinedFilterIndex = predefinedFilters.findIndex(
    (filter) => filter.name === activePredefinedFilter
  )
  const [selectedIndex, setSelectedIndex] = useState(
    activePredefinedFilterIndex
  )

  const handleTabSelect = (index) => {
    setSelectedIndex(index)
    setActivePredefinedFilter(predefinedFilters[index].name)
  }

  return (
    <Tabs
      selectedIndex={selectedIndex}
      onSelect={(index) => handleTabSelect(index)}
      className="mb-4"
    >
      <TabList>
        {predefinedFilters.map((filter) => (
          <Tab key={filter.name}>{filter.displayName}</Tab>
        ))}
      </TabList>
      {predefinedFilters.map((filter) => (
        <TabPanel key={filter.name}></TabPanel>
      ))}
    </Tabs>
  )
}

export default PredefinedFilters
