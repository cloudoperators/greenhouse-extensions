/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo } from "react"
import {
  Icon,
  DataGrid,
  DataGridRow,
  DataGridCell,
  Container,
} from "juno-ui-components"
import { getVulnerability } from "../queries"
import useStore from "../hooks/useStore"
import { useActions } from "messages-provider"
import { useRouter } from "url-state-router"
import { parseError } from "../helpers"
import {
  DetailSection,
  DetailSectionBox,
  DetailContentHeading,
  DetailSectionHeader,
} from "../styles"
import HintLoading from "./HintLoading"
import HintNotFound from "./HintNotFound"
import { DateTime } from "luxon"

const VulnerabilitiyDetails = () => {
  const { options, routeParams } = useRouter()

  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))
  const { addMessage } = useActions()
  const vulnerabilityId = routeParams?.vulnerabilityId
  const { isLoading, isError, isFetching, data, error } = getVulnerability(
    auth?.id_token,
    endpoint,
    vulnerabilityId
  )

  // dispatch error with useEffect because error variable will first set once all retries did not succeed
  useEffect(() => {
    if (error) {
      addMessage({
        variant: "error",
        text: parseError(error),
      })
    }
  }, [error])

  const scnLastModified = useMemo(() => {
    if (data?.Scn?.ScnLastModified) {
      return DateTime.fromSQL(data?.Scn?.ScnLastModified).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    }
  }, [data?.Scn?.ScnLastModified])

  const cveLastModified = useMemo(() => {
    if (data?.Scn?.CveLastModified) {
      return DateTime.fromSQL(data?.Scn?.CveLastModified).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    }
  }, [data?.Scn?.CveLastModified])

  return (
    <Container px={false}>
      {isLoading && !data ? (
        <HintLoading text="Loading details..." />
      ) : (
        <>
          {data ? (
            <>
              <h1 className={DetailContentHeading}>
                <Icon className="mr-2" icon="autoAwesomeMotion" />{" "}
                {data?.Scn?.Name}
              </h1>
              <div className={DetailSection}>
                <div className={DetailSectionBox}>
                  <DataGrid gridColumnTemplate="1fr 9fr">
                    <DataGridRow>
                      <DataGridCell>
                        <b>ID: </b>
                      </DataGridCell>
                      <DataGridCell>{data?.ID}</DataGridCell>
                    </DataGridRow>
                    <DataGridRow>
                      <DataGridCell>
                        <b>CCScore: </b>
                      </DataGridCell>
                      <DataGridCell>{data?.CCScore}</DataGridCell>
                    </DataGridRow>
                    <DataGridRow>
                      <DataGridCell>
                        <b>CCScoreReason: </b>
                      </DataGridCell>
                      <DataGridCell>{data?.CCScoreReason}</DataGridCell>
                    </DataGridRow>
                    <DataGridRow>
                      <DataGridCell>
                        <b>State: </b>
                      </DataGridCell>
                      <DataGridCell>{data?.State}</DataGridCell>
                    </DataGridRow>
                  </DataGrid>
                </div>
              </div>

              <div className={DetailSection}>
                <p className={DetailSectionHeader}>
                  SAP CERT Notifications (SCN) information
                </p>
                <div className="mt-4">
                  <div className={DetailSectionBox}>
                    <DataGrid gridColumnTemplate="2fr 8fr">
                      <DataGridRow>
                        <DataGridCell>
                          <b>Name: </b>
                        </DataGridCell>
                        <DataGridCell>{data?.Scn?.Name}</DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>Last modified: </b>
                        </DataGridCell>
                        <DataGridCell>{scnLastModified}</DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>Threat level client: </b>
                        </DataGridCell>
                        <DataGridCell>
                          {data?.Scn?.ThreatLevelClient}
                        </DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>Threat level overall: </b>
                        </DataGridCell>
                        <DataGridCell>
                          {data?.Scn?.ThreatLevelOverall}
                        </DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>Threat level server: </b>
                        </DataGridCell>
                        <DataGridCell>
                          {data?.Scn?.ThreatLevelServer}
                        </DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>URL: </b>
                        </DataGridCell>
                        <DataGridCell>
                          {data?.Scn?.URL && (
                            <a href={data?.Scn?.URL} target="_blank">
                              {data?.Scn?.URL}
                            </a>
                          )}
                        </DataGridCell>
                      </DataGridRow>
                    </DataGrid>
                  </div>
                </div>
              </div>

              <div className={DetailSection}>
                <p className={DetailSectionHeader}>
                  Common Vulnerabilities and Exposures (CVE) information
                </p>
                <div className="mt-4">
                  <div className={DetailSectionBox}>
                    <DataGrid gridColumnTemplate="1fr 9fr">
                      <DataGridRow>
                        <DataGridCell>
                          <b>Name: </b>
                        </DataGridCell>
                        <DataGridCell>{data?.Scn?.CveID}</DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>Last modified: </b>
                        </DataGridCell>
                        <DataGridCell>{cveLastModified}</DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>URL: </b>
                        </DataGridCell>
                        <DataGridCell>
                          {data?.Scn?.CveURL && (
                            <a href={data?.Scn?.CveURL} target="_blank">
                              {data?.Scn?.CveURL}
                            </a>
                          )}
                        </DataGridCell>
                      </DataGridRow>
                      <DataGridRow>
                        <DataGridCell>
                          <b>CVSS score: </b>
                        </DataGridCell>
                        <DataGridCell>{data?.Scn?.CvssBase}</DataGridCell>
                      </DataGridRow>
                    </DataGrid>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <HintNotFound
              text={`No details found for vulnerability id ${vulnerabilityId}`}
            />
          )}
        </>
      )}
    </Container>
  )
}

export default VulnerabilitiyDetails
