import React from "react"

import useStore from "../../hooks/useStore"
import Region from "./Region"

const regionsClasses = `
  grid
  auto-rows-fr
  grid-cols-[repeat(auto-fit,_minmax(18.75rem,_1fr))]
  gap-3
  mb-8
`

const RegionsList = () => {
  const isLoading = useStore((state) => state.alerts.isLoading)
  const severityCountsPerRegion = useStore((state) => state.alerts.severityCountsPerRegion)

  return (
    <>
      { !isLoading &&
        <div className={`regions ${regionsClasses}`}>
          { Object.keys(severityCountsPerRegion).sort().map((region) => (
            <Region key={region} region={region} severityCounts={severityCountsPerRegion[region]} />
          ))}
        </div>
      }
    </>
  )
}

export default RegionsList