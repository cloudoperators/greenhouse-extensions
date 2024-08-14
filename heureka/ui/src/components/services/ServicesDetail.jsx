/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  Pill,
  Stack,
  ContentHeading,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
} from "@cloudoperators/juno-ui-components"
import { useQueryClientFnReady, useShowServiceDetail } from "../StoreProvider"
import { useQuery } from "@tanstack/react-query"

const ServicesDetail = () => {
  const showServiceDetail = useShowServiceDetail()

  const queryClientFnReady = useQueryClientFnReady()

  const serviceElem = useQuery({
    queryKey: ["services", { filter: { serviceName: [showServiceDetail] } }],
    enabled: !!queryClientFnReady,
  })

  const service = useMemo(() => {
    if (!serviceElem) return null
    return serviceElem?.data?.Services?.edges[0]?.node
  }, [serviceElem])

  const highestSeverity = (vulnerablities) => {
    const highest = vulnerablities.reduce(
      (max, vulnerablity) =>
        vulnerablity?.node?.severity?.score > max?.node?.severity?.score
          ? vulnerablity
          : max,
      vulnerablities[0]
    )
    if (!highest?.node?.severity?.value) return

    return (
      highest?.node?.severity?.value +
      " (" +
      highest?.node?.severity?.score +
      ")"
    )
  }

  return (
    <Stack direction="vertical" gap="4">
      <DataGrid columns={2}>
        <DataGridRow>
          <DataGridHeadCell>Owner</DataGridHeadCell>

          <DataGridCell>
            <Stack gap="2" wrap={true}>
              {service?.owners?.edges?.map((owner, i) => (
                <Pill
                  key={i}
                  onClick={function noRefCheck() {}}
                  onClose={function noRefCheck() {}}
                  pillKey={owner.node.uniqueUserId}
                  pillKeyLabel={owner.node.uniqueUserId}
                  pillValue={owner.node.name}
                  pillValueLabel={owner.node.name}
                />
              ))}
            </Stack>
          </DataGridCell>
        </DataGridRow>

        <DataGridRow>
          <DataGridHeadCell>Support Group</DataGridHeadCell>

          <DataGridCell>
            <ul>
              {service?.supportGroups?.edges?.map((supportGroup) => {
                return <li>{supportGroup?.node?.name}</li>
              })}
            </ul>
          </DataGridCell>
        </DataGridRow>
      </DataGrid>
      <>
        <ContentHeading heading="Component Instances" />

        <DataGrid columns={4}>
          <DataGridRow>
            <DataGridHeadCell>Component</DataGridHeadCell>
            <DataGridHeadCell>Version</DataGridHeadCell>
            <DataGridHeadCell>Total Vulnerabilities</DataGridHeadCell>
            <DataGridHeadCell>Highest Severity</DataGridHeadCell>
          </DataGridRow>

          {service?.componentInstances?.edges?.map((componentInstance, i) => (
            <DataGridRow key={i}>
              <DataGridCell>
                {componentInstance?.node?.componentVersion?.component?.name}
              </DataGridCell>

              <DataGridCell>
                {componentInstance?.node?.componentVersion?.version}
              </DataGridCell>

              <DataGridCell>
                {componentInstance?.node?.issueMatches?.edges?.length}
              </DataGridCell>

              <DataGridCell>
                {highestSeverity(componentInstance?.node?.issueMatches?.edges)}
              </DataGridCell>
            </DataGridRow>
          ))}
        </DataGrid>
      </>
    </Stack>
  )
}

export default ServicesDetail
