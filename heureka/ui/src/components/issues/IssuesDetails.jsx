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
import { listOfCommaSeparatedObjs, severityString } from "../shared/Helper"
import LoadElement from "../shared/LoadElement"

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

  return (
    <>
      {/* todo add messageprovider here */}
      <Stack direction="vertical" gap="4">
        <DataGrid columns={2}>
          <DataGridRow>
            <DataGridHeadCell>Component Name</DataGridHeadCell>

            <DataGridCell>
              <LoadElement
                elem={
                  issue?.componentInstance?.componentVersion?.component?.name
                }
              />
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>CVE</DataGridHeadCell>

            <DataGridCell>
              <LoadElement elem={issue?.issue?.primaryName} />
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Component Version</DataGridHeadCell>

            <DataGridCell>
              <LoadElement
                elem={issue?.componentInstance?.componentVersion.version}
              />
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Services</DataGridHeadCell>

            <DataGridCell>
              <LoadElement elem={issue?.componentInstance?.service?.name} />
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Owner</DataGridHeadCell>

            <DataGridCell>
              {issue?.componentInstance?.service?.owners?.edges ? (
                <Stack gap="2" wrap={true}>
                  {issue?.componentInstance?.service?.owners?.edges?.map(
                    (owner, i) => (
                      <Pill
                        key={i}
                        pillKey={owner.node.uniqueUserId}
                        pillKeyLabel={owner.node.uniqueUserId}
                        pillValue={owner.node.name}
                        pillValueLabel={owner.node.name}
                      />
                    )
                  )}
                </Stack>
              ) : (
                <LoadElement />
              )}
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Support Group</DataGridHeadCell>

            <DataGridCell>
              <LoadElement
                elem={
                  <ul>
                    {listOfCommaSeparatedObjs(
                      issue?.componentInstance?.service?.supportGroups,
                      "name"
                    )}
                  </ul>
                }
              />
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Issue Variant</DataGridHeadCell>

            <DataGridCell>
              {<LoadElement elem={issue?.issue?.type} />}
            </DataGridCell>
          </DataGridRow>

          <DataGridRow>
            <DataGridHeadCell>Issue Severity</DataGridHeadCell>

            <DataGridCell>
              {<LoadElement elem={severityString(issue?.severity)} />}
            </DataGridCell>
          </DataGridRow>
        </DataGrid>
      </Stack>
    </>
  )
}

export default IssuesDetails
