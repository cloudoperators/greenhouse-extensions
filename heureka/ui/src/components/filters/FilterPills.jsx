/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import { useActiveFilters, useFilterActions } from "../../hooks/useAppStore"
import { humanizeString } from "../../lib/utils"

const FilterPills = ({ entityName }) => {
  const activeFilters = useActiveFilters(entityName)
  const { removeActiveFilter } = useFilterActions()

  return (
    <Stack gap="2" wrap={true}>
      {Object.entries(activeFilters || {}).map(([key, values]) => {
        return values.map((value) => (
          <Pill
            pillKey={humanizeString(key)}
            pillValue={value}
            closeable
            onClose={() => removeActiveFilter(entityName, key, value)}
            key={`${key}:${value}`}
          />
        ))
      })}
    </Stack>
  )
}

export default FilterPills
