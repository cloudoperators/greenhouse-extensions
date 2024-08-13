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

  return (
    <>
      <DataGrid columns={2}>
        <DataGridRow>
          <DataGridHeadCell>Owner</DataGridHeadCell>

          <DataGridCell>
            <Stack gap="2" wrap={true}>
              {service?.owners?.edges?.map((owner) => (
                <Pill
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
            {service?.supportGroups?.edges?.map(
              (supportGroup) => supportGroup?.node?.name
            )}
          </DataGridCell>
        </DataGridRow>
      </DataGrid>

      <ContentHeading heading="Component Instances" />

      <DataGrid columns={4}>
        <DataGridRow>
          <DataGridHeadCell>ccrn</DataGridHeadCell>
          <DataGridHeadCell>count</DataGridHeadCell>
          <DataGridHeadCell>component version</DataGridHeadCell>
          <DataGridHeadCell>component name</DataGridHeadCell>
        </DataGridRow>

        {service?.componentInstances?.edges?.map((componentInstance) => (
          <DataGridRow>
            <DataGridCell>{JSON.stringify(componentInstance)}</DataGridCell>

            <DataGridCell></DataGridCell>

            <DataGridCell></DataGridCell>

            <DataGridCell></DataGridCell>
          </DataGridRow>
        ))}
      </DataGrid>

      <ContentHeading heading="Issue Matches" />
      {JSON.stringify(service?.componentInstances)}
    </>
  )
}

export default ServicesDetail
