import React from "react"

import { Icon, Stack } from "juno-ui-components"
import RegionSeverity from "./RegionSeverity"

const regionStyles = `
  grid
  grid-cols-[repeat(4,_minmax(5rem,_1fr))]
  bg-theme-background-lvl-1
`

const regionHeader = `
  bg-theme-background-lvl-2
  font-bold
  px-3
  py-2
  whitespace-nowrap
`

const Region = ({ region, severityCounts }) => {
  return (
    <div className={`region ${regionStyles}`}>
      <Stack alignment="center" distribution="center" className={regionHeader}>
        {region}
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
