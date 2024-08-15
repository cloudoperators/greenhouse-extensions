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
import { listOfCommaSeparatedObjs } from "../shared/Helper"

const IssuesDetails = () => {
  const showServiceDetail = useShowServiceDetail()

  const queryClientFnReady = useQueryClientFnReady()

  const issueElem = useQuery({
    queryKey: ["issues", { filter: { id: [showServiceDetail] } }],
    enabled: !!queryClientFnReady,
  })
  console.log("sdf", issueElem?.data)
  // const service = useMemo(() => {
  //   if (!serviceElem) return null
  //   return serviceElem?.data?.Services?.edges[0]?.node
  // }, [serviceElem])

  return (
    <Stack direction="vertical" gap="4">
      <p>loaded</p>
    </Stack>
  )
}

export default IssuesDetails
