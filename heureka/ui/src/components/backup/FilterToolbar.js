/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { FilterToolbarStateProvider } from "./FilterToolbarStore"
import FilterToolbarCore from "./FilterToolbarCore"

const FilterToolbar = ({
  filterTypes,
  onSearchTerm,
  isLoading,
  filterLabels,
  placeholders,
}) => {
  return (
    <FilterToolbarStateProvider filterTypes={filterTypes}>
      <FilterToolbarCore
        onSearchTerm={onSearchTerm}
        isLoading={isLoading}
        filterLabels={filterLabels}
        placeholders={placeholders}
      />
    </FilterToolbarStateProvider>
  )
}

export default FilterToolbar
