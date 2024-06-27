/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
<<<<<<< HEAD
import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import { useActiveFilters, useActions } from "../StoreProvider"

const FilterPills = () => {
  const activeFilters = useActiveFilters()
  const { removeActiveFilter } = useActions()
=======

import { Pill, Stack } from "juno-ui-components"
import { useActiveFilters, useFilterActions } from "../../hooks/useAppStore"

const FilterPills = () => {
  const activeFilters = useActiveFilters()
  const { removeActiveFilter } = useFilterActions()
>>>>>>> 931e76db (feat(heureka): add filtering and search functionality for services tab)

  return (
    <Stack gap="2" wrap={true}>
      {Object.entries(activeFilters).map(([key, values]) => {
        return values.map((value) => (
          <Pill
            pillKey={key}
            pillValue={value}
            closeable
            onClose={() => removeActiveFilter(key, value)}
            key={`${key}:${value}`}
          />
        ))
      })}
<<<<<<< HEAD
=======
      :
>>>>>>> 931e76db (feat(heureka): add filtering and search functionality for services tab)
    </Stack>
  )
}

export default FilterPills
