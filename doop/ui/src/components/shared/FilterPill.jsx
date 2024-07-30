/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { useFiltersActions } from "../StoreProvider"
import { Pill } from "@cloudoperators/juno-ui-components"

const FilterPill = ({ name, value, nameLabel, valueLabel }) => {
  const { add: addFilter } = useFiltersActions()

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Pill
        pillKey={name}
        pillKeyLabel={nameLabel || name}
        pillValue={value}
        pillValueLabel={valueLabel || value}
        onClick={() => {
          const filterName = name === "service" ? `check:${name}` : name
          addFilter(filterName, value)
        }}
      />
    </div>
  )
}

export default FilterPill
