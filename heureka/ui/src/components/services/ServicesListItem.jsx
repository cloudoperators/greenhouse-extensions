/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "@cloudoperators/juno-ui-components"
import { listOfCommaSeparatedObjs } from "../shared/Helper"

const countIssueMatches = (service) => {
  return service?.componentInstances?.edges?.reduce((acc, edge) => {
    return acc + (edge?.node?.issueMatches?.edges?.length || 0)
  }, 0)
}

const ServicesListItem = ({ item }) => {
  const service = useMemo(() => {
    if (!item) return {}
    return item?.node
  }, [item])

  const issueMatchesCount = useMemo(() => countIssueMatches(service), [service])

  return (
    <DataGridRow>
      <DataGridCell>{service?.name}</DataGridCell>
      <DataGridCell>
        {listOfCommaSeparatedObjs(service?.owners, "name")}
      </DataGridCell>
      <DataGridCell>
        {listOfCommaSeparatedObjs(service?.supportGroups, "name")}
      </DataGridCell>
      <DataGridCell>
        {service?.componentInstances?.edges?.length || 0}
      </DataGridCell>
      <DataGridCell>{issueMatchesCount}</DataGridCell>
    </DataGridRow>
  )
}

export default ServicesListItem
