import React from "react"

import { useAlertsIsLoading, useAlertsRegions, useAlertsSeverityCountsPerRegion } from "../../hooks/useStore"
import Region from "./Region"

const regionsClasses = `
  grid
  auto-rows-fr
  grid-cols-[repeat(auto-fit,_minmax(18.75rem,_1fr))]
  gap-3
  mb-8
`

const RegionsList = () => {
  const isLoading = useAlertsIsLoading()
  const severityCountsPerRegion = useAlertsSeverityCountsPerRegion()
  const regions = useAlertsRegions()

  return (
    <>
      { !isLoading &&
        <div className={`regions ${regionsClasses}`}>
          { regions.map((region) => (
            <Region key={region} region={region} severityCounts={severityCountsPerRegion[region]} />
          ))}
        </div>
      }
    </>
  )
}

export default RegionsList