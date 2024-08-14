/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Stack } from "@cloudoperators/juno-ui-components"

import FilterSelect from "./FilterSelect"
import FilterPills from "./FilterPills"

const filtersStyles = `
  bg-theme-background-lvl-1
  py-2
  px-4
  my-px
`

const Filters = () => {
  return (
    <Stack direction="vertical" gap="4" className={`filters ${filtersStyles}`}>
      <FilterSelect />
      <FilterPills />
    </Stack>
  )
}

export default Filters
