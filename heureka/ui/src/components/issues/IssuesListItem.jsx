/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"
import { listOfCommaSeparatedObjs } from "../shared/Helper"
import { DateTime } from "luxon"

const IssuesListItem = ({ item }) => {
  const formatDate = (dateStr) => {
    const dateObj = DateTime.fromISO(dateStr)
    return dateObj.toFormat("yyyy.MM.dd.HH:mm:ss")
  }
  return (
    <DataGridRow>
      <DataGridCell>{item?.node?.issue?.primaryName}</DataGridCell>
      <DataGridCell>{item?.node?.issue?.type}</DataGridCell>
      {/* <DataGridCell>
        {listOfCommaSeparatedObjs(
          item?.node?.effectiveIssueVariants,
          "secondaryName"
          )}
          </DataGridCell> */}
      <DataGridCell>{formatDate(item?.node?.remediationDate)}</DataGridCell>
      <DataGridCell>{item?.node?.status}</DataGridCell>
      <DataGridCell>{item?.node?.severity?.value}</DataGridCell>
      <DataGridCell>
        {item?.node?.componentInstance?.componentVersion?.component?.name}
      </DataGridCell>
      <DataGridCell>
        {item?.node?.componentInstance?.componentVersion?.version}
      </DataGridCell>
      <DataGridCell>
        {item?.node?.componentInstance?.service?.name}
      </DataGridCell>
      <DataGridCell>
        {listOfCommaSeparatedObjs(
          item?.node?.componentInstance?.service?.supportGroups,
          "name"
        )}
      </DataGridCell>
      <DataGridCell>{item?.node?.componentInstance?.count}</DataGridCell>
    </DataGridRow>
  )
}

export default IssuesListItem
