/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"

const cellClasses = ``

const listOfSGsOrOw = (objs) => {
  objs = objs?.edges || []
  return objs
    .filter((obj) => obj?.node?.name)
    .map((obj) => obj?.node?.name)
    .join(", ")
}

const countVulnerabilityMatches = (service) => {
  return service?.componentInstances?.edges?.reduce((acc, edge) => {
    return acc + (edge?.node?.vulnerabilityMatches?.edges?.length || 0)
  }, 0)
}

const ServicesListItem = ({ item }) => {
  const service = useMemo(() => {
    if (!item) return {}
    return item?.node
  }, [item])

  const vulnerabilityMatchesCount = useMemo(
    () => countVulnerabilityMatches(service),
    [service]
  )

  return (
    <DataGridRow>
      <DataGridCell className={cellClasses}>{service?.name}</DataGridCell>
      <DataGridCell className={cellClasses}>
        {listOfSGsOrOw(service?.owners)}
      </DataGridCell>
      <DataGridCell className={cellClasses}>
        {listOfSGsOrOw(service?.supportGroups)}
      </DataGridCell>
      <DataGridCell className={cellClasses}>
        {service?.componentInstances?.edges?.length || 0}
      </DataGridCell>
      <DataGridCell className={cellClasses}>
        {vulnerabilityMatchesCount}
      </DataGridCell>
    </DataGridRow>
  )
}

export default ServicesListItem
