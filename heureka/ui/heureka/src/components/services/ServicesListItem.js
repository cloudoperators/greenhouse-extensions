/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"

const cellClasses = `
justify-start
`

const listOfSGs = (sgs) => {
  sgs = sgs?.edges || []
  return sgs
    .filter((sg) => sg?.node?.name)
    .map((sg) => sg?.node?.name)
    .join(", ")
}

const ServicesListItem = ({ item }) => {
  const service = useMemo(() => {
    if (!item) return {}
    return item?.node
  }, [item])

  return (
    <DataGridRow>
      <DataGridCell className={cellClasses}>{service?.name}</DataGridCell>
      <DataGridCell className={cellClasses}>
        {listOfSGs(service?.supportGroups)}
      </DataGridCell>
      <DataGridCell className={cellClasses}></DataGridCell>
      <DataGridCell className={cellClasses}></DataGridCell>
      <DataGridCell className={cellClasses}></DataGridCell>
    </DataGridRow>
  )
}

export default ServicesListItem
