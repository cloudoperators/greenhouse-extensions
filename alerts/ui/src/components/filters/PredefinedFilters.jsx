import React from "react"

import { Button, Stack } from "juno-ui-components"
import { useFilterActions, usePredefinedFilters } from "../../hooks/useStore"


const PredefinedFilters = () => {
  const { togglePredefinedFilter } = useFilterActions()
  const predefinedFilters = usePredefinedFilters()

  return (
    <Stack gap="2" wrap={true}>
      { predefinedFilters.map((filter) => (
        <Button
          label={filter.displayName}
          variant={filter.active ? "primary" : "default"}
          onClick={() => togglePredefinedFilter(filter.name)}
          key={filter.name}
        />
      ))}

    </Stack>
  )
}

export default PredefinedFilters