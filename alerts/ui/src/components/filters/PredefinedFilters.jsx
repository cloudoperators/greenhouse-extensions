import React from "react"

import { SwitchRow } from "juno-ui-components"
import { useFilterActions, usePredefinedFilters } from "../../hooks/useStore"


const PredefinedFilters = () => {
  const { togglePredefinedFilter } = useFilterActions()
  const predefinedFilters = usePredefinedFilters()

  return (
    <div>
      { predefinedFilters.map((filter) => (
        <SwitchRow
          label={filter.displayName}
          name={filter.name}
          on={filter.active}
          onChange={() => togglePredefinedFilter(filter.name)}
          key={filter.name}
        />
      ))}

    </div>
  )
}

export default PredefinedFilters