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
import { useQueryClientFnReady, useShowIssueDetail } from "../StoreProvider"
import { useQuery } from "@tanstack/react-query"
import { listOfCommaSeparatedObjs } from "../shared/Helper"
import LoadingText from "../shared/LoadingText"

const IssuesDetails = () => {
  const showIssueDetail = useShowIssueDetail()

  const queryClientFnReady = useQueryClientFnReady()

  const issueElem = useQuery({
    queryKey: ["issues", { filter: { id: [showIssueDetail] } }],
    enabled: !!queryClientFnReady,
  })
  const issue = useMemo(() => {
    if (!issueElem) return null
    return issueElem?.data?.IssueMatches?.edges[0]?.node
  }, [issueElem])

  console.log(issue, "sdfs")
  return (
    <>
      {/* todo add messageprovider here */}
      <Stack direction="vertical" gap="4">
        <DataGrid columns={2}>
          <DataGridRow>
            <DataGridHeadCell>Component Name</DataGridHeadCell>

            <DataGridCell>
              {issue?.componentInstance?.componentVersion?.component?.name ? (
                issue?.componentInstance?.componentVersion?.component?.name
              ) : (
                <LoadingText />
              )}
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>CVE</DataGridHeadCell>

            <DataGridCell>
              {issue?.issue?.primaryName ? (
                issue?.issue?.primaryName
              ) : (
                <LoadingText />
              )}
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Component Version</DataGridHeadCell>

            <DataGridCell>
              {issue?.componentInstance?.componentVersion.version ? (
                issue?.componentInstance?.componentVersion.version
              ) : (
                <LoadingText />
              )}
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Services</DataGridHeadCell>

            <DataGridCell>
              {issue?.componentInstance?.service?.name ? (
                issue?.componentInstance?.service?.name
              ) : (
                <LoadingText />
              )}
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Issue Variant</DataGridHeadCell>

            <DataGridCell>
              {issue?.issue?.type ? issue?.issue?.type : <LoadingText />}
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Issue Severity</DataGridHeadCell>

            <DataGridCell>
              {issue?.severity ? (
                issue?.severity?.value + " (" + issue?.severity?.score + ")"
              ) : (
                <LoadingText />
              )}
            </DataGridCell>
          </DataGridRow>
        </DataGrid>
      </Stack>
    </>
  )
}

export default IssuesDetails
