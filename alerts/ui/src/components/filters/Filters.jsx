import React from "react"
import { Stack } from "juno-ui-components"

import FilterSelect from "./FilterSelect"
import FilterPills from "./FilterPills"
import PredefinedFilters from "./PredefinedFilters"

const filtersStyles = `
  bg-theme-background-lvl-2
  py-2
  px-4
  my-px
`

const Filters = () => {
  return (
    <Stack direction="vertical" gap="4" className={`filters ${filtersStyles}`}>
      <FilterSelect />
      <FilterPills />
      <PredefinedFilters />
    </Stack>
  )
}

export default Filters
