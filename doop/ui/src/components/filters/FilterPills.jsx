/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Pill, Stack } from "@cloudoperators/juno-ui-components"
import { useFiltersActive, useFiltersActions } from "../StoreProvider"
import { valueToLabel } from "../../lib/helpers"

const FilterPills = () => {
  const activeFilters = useFiltersActive()
  const { remove } = useFiltersActions()

  if (!activeFilters) return null

  return (
    <Stack wrap gap="2">
      {activeFilters.map(({ key, value, label }, i) => (
        <Pill
          pillKey={key?.split(":")?.[1]}
          pillValue={value}
          pillKeyLabel={valueToLabel(label)}
          closeable
          onClose={() => remove(key, value)}
          key={i}
        />
      ))}
    </Stack>
  )
}

export default FilterPills
