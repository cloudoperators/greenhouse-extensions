import React from "react"
import { useFiltersActions } from "../StoreProvider"
import { Pill } from "juno-ui-components"

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
