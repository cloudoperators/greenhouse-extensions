/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react"

import { Stack, TabNavigation, TabNavigationItem } from "juno-ui-components"
import {
  useActivePredefinedFilter,
  useFilterActions,
  usePredefinedFilters,
} from "../../hooks/useAppStore"
import SilenceScheduledWrapper from "../silences/SilenceScheduledWrapper"

const PredefinedFilters = () => {
  const { setActivePredefinedFilter } = useFilterActions()
  const predefinedFilters = usePredefinedFilters()
  const activePredefinedFilter = useActivePredefinedFilter()

  const [selectedItem, setSelectedItem] = useState(activePredefinedFilter)

  const handleTabSelect = (item) => {
    setSelectedItem(item)
    setActivePredefinedFilter(item)
  }

  return (
    <Stack>
      <TabNavigation
        activeItem={selectedItem}
        onActiveItemChange={handleTabSelect}
      >
        {predefinedFilters.map((filter) => (
          <TabNavigationItem
            key={filter.name}
            value={filter.name}
            label={filter.displayName}
          />
        ))}
      </TabNavigation>
      <div className="ml-auto">
        <SilenceScheduledWrapper />
      </div>
    </Stack>
  )
}

export default PredefinedFilters
