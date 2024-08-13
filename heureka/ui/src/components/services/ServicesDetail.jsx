/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { Stack, PanelBody } from "@cloudoperators/juno-ui-components"
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
      <p>Details for {service?.name} </p>
      <p>Owners</p>
      {JSON.stringify(service?.owners)}
      <p>Support Groups</p>
      {JSON.stringify(service?.supportGroups)}
      <p>Component Instances</p>
      {JSON.stringify(service?.componentInstances)}
      <p>Issue Matches</p>
      {JSON.stringify(service?.componentInstances)}
    </>
  )
}

export default ServicesDetail
