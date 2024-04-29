/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Stack } from "juno-ui-components"
import RegionSeverity from "./RegionSeverity"
import { useFilterActions, useActiveFilters } from "../../hooks/useAppStore"

const regionStyles = `
  grid
  grid-cols-[repeat(4,_minmax(5rem,_1fr))]

  group
  bg-theme-background-lvl-1
  hover:bg-theme-background-lvl-2
  hover:text-theme-high
  cursor-pointer
`

const regionHeader = `
  bg-theme-background-lvl-2
  group-hover:bg-theme-background-lvl-3
  font-bold
  px-3
  py-2
  whitespace-nowrap
`

const Region = ({ region, severityCounts }) => {
  const { addActiveFilter, removeActiveFilter } = useFilterActions()
  const activeFilters = useActiveFilters()

  const handleRegionClick = () => {
    // if the region is already active, remove it
    if (activeFilters?.region?.includes(region)) {
      removeActiveFilter("region", region)
    } else {
      addActiveFilter("region", region)
    }
  }

  return (
    <div
      className={`region ${regionStyles}`}
      onClick={() => handleRegionClick()}
    >
      <Stack alignment="center" distribution="center" className={regionHeader}>
        {region || "Counts"}
      </Stack>
      <RegionSeverity
        severity="critical"
        severityCountTotal={severityCounts?.critical?.total}
        severityCountSuppressed={severityCounts?.critical?.suppressed}
      />
      <RegionSeverity
        severity="warning"
        severityCountTotal={severityCounts?.warning?.total}
        severityCountSuppressed={severityCounts?.warning?.suppressed}
      />
      <RegionSeverity
        severity="info"
        severityCountTotal={severityCounts?.info?.total}
        severityCountSuppressed={severityCounts?.info?.suppressed}
      />
    </div>
  )
}

export default Region
