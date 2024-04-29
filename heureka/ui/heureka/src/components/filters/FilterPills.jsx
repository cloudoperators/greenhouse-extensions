/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Pill, Stack } from "juno-ui-components"
// import { useActiveFilters, useFilterActions } from "../../hooks/useAppStore"

const FilterPills = () => {
  // const activeFilters = useActiveFilters()
  // const { removeActiveFilter } = useFilterActions()

  return (
    <Stack gap="2" wrap={true}>
      {/* {Object.entries(activeFilters).map(([key, values]) => {
        return values.map((value) => (
          <Pill
            pillKey={key}
            pillValue={value}
            closeable
            onClose={() => removeActiveFilter(key, value)}
            key={`${key}:${value}`}
          />
        ))
      })} */}
    </Stack>
  )
}

export default FilterPills
