/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import {
  useAlertsIsLoading,
  useAlertsRegionsFiltered,
  useAlertsSeverityCountsPerRegion,
} from "../../hooks/useAppStore"
import Region from "./Region"

const regionsClasses = `
  grid
  auto-rows-fr
  grid-cols-[repeat(auto-fit,_minmax(21rem,_1fr))]
  gap-3
  mb-8
`

const RegionsList = () => {
  const isLoading = useAlertsIsLoading()
  const severityCountsPerRegion = useAlertsSeverityCountsPerRegion()
  const regions = useAlertsRegionsFiltered()

  return (
    <>
      {!isLoading && regions && (
        <div className={`regions ${regionsClasses}`}>
          {regions.map((region) => (
            <Region
              key={`${region}`}
              region={region}
              severityCounts={severityCountsPerRegion[region]}
            />
          ))}

        </div>
      )}
    </>
  )
}

export default RegionsList
