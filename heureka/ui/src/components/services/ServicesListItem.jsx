/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"
import { listOfCommaSeparatedObjs } from "../shared/Helper"

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
      <DataGridCell>{service?.name}</DataGridCell>
      <DataGridCell>{listOfCommaSeparatedObjs(service?.owners)}</DataGridCell>
      <DataGridCell>
        {listOfCommaSeparatedObjs(service?.supportGroups)}
      </DataGridCell>
      <DataGridCell>
        {service?.componentInstances?.edges?.length || 0}
      </DataGridCell>
      <DataGridCell>{vulnerabilityMatchesCount}</DataGridCell>
    </DataGridRow>
  )
}

export default ServicesListItem
