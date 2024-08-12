/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "@cloudoperators/juno-ui-components"
import { listOfCommaSeparatedObjs } from "../shared/Helper"
import constants from "../shared/constants"

import {
  useActions,
  useShowServiceDetail,
  useShowPanel,
} from "../StoreProvider"

const countIssueMatches = (service) => {
  return service?.componentInstances?.edges?.reduce((acc, edge) => {
    return acc + (edge?.node?.issueMatches?.edges?.length || 0)
  }, 0)
}

const ServicesListItem = ({ item }) => {
  const { setShowServiceDetail, setShowPanel } = useActions()
  const showServiceDetail = useShowServiceDetail()
  const showPanel = useShowPanel()
  const service = useMemo(() => {
    if (!item) return {}
    return item?.node
  }, [item])

  const issueMatchesCount = useMemo(() => countIssueMatches(service), [service])

  const handleClick = () => {
    if (
      showServiceDetail === service?.id &&
      showPanel === constants.PANEL_SERVICE
    ) {
      {
        setShowServiceDetail(null)
        setShowPanel(constants.PANEL_NONE)
      }
    } else {
      setShowServiceDetail(service?.id)
      setShowPanel(constants.PANEL_SERVICE)
    }
  }

  return (
    <DataGridRow
      className={`cursor-pointer ${
        showServiceDetail === service?.id ? "active" : ""
      }`}
      onClick={() => handleClick()}
    >
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
