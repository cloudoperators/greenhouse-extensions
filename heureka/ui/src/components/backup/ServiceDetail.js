/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo } from "react"
import { getService } from "../queries"
import useStore from "../hooks/useStore"
import { useActions } from "messages-provider"
import { useRouter } from "url-state-router"
import {
  parseError,
  patchExampl1,
  patchExampl2,
  changeLogExample1,
  changeLogExample2,
} from "../helpers"
import {
  Icon,
  DataGrid,
  DataGridRow,
  DataGridCell,
  Container,
  Stack,
  Button,
} from "juno-ui-components"
import {
  DetailSection,
  DetailSectionBox,
  DetailContentHeading,
  DetailSectionHeader,
} from "../styles"
import HintLoading from "./HintLoading"
import HintNotFound from "./HintNotFound"
import PatchLogsList from "./PatchLogsList"
import ComponentsList from "./ComponentsList"
import { SERVICES_PATH } from "./AppRouter"
import ChangesLogList from "./ChangesLogList"

const listOfUsers = (users) => {
  users = users || []
  return users.map((user, index) => (
    <span key={index}>
      <span>{index ? ", " : ""}</span>
      {`${user.Name} `}
      <small className="text-sm pt-1 whitespace-nowrap text-theme-disabled">
        ({user.SapID})
      </small>
    </span>
  ))
}
const ServiceDetail = () => {
  const { options, routeParams, navigateTo } = useRouter()

  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))
  const { addMessage } = useActions()
  const serviceId = routeParams?.serviceId
  const { isLoading, isError, isFetching, data, error } = getService(
    auth?.id_token,
    endpoint,
    serviceId
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

  const owners = useMemo(() => {
    if (!data?.Owners) return []
    return listOfUsers(data.Owners)
  }, [data?.Owners])

  const operators = useMemo(() => {
    if (!data?.Operators) return []
    return listOfUsers(data.Operators)
  }, [data?.Operators])

  const components = useMemo(() => {
    if (!data?.Components) return []
    return data.Components
  }, [data])

  const patches = useMemo(() => {
    if (data?.Name && data?.Name === "Elektra") {
      return [patchExampl2, patchExampl1]
    }
    return []
  }, [data])

  const changes = useMemo(() => {
    if (data?.Name && data?.Name === "Elektra") {
      return [changeLogExample1, changeLogExample2]
    }
    return []
  }, [data])

  return (
    <Container px={false}>
      {isLoading && !data ? (
        <HintLoading text="Loading details..." />
      ) : (
        <>
          {data ? (
            <>
              <h1 className={DetailContentHeading}>
                <Icon className="mr-2" icon="dns" /> {data.Name}
              </h1>

              <div className={DetailSection}>
                <div className={DetailSectionBox}>
                  <DataGrid gridColumnTemplate="1fr 9fr">
                    <DataGridRow>
                      <DataGridCell>
                        <b>ID: </b>
                      </DataGridCell>
                      <DataGridCell>{data.ID}</DataGridCell>
                    </DataGridRow>
                    <DataGridRow>
                      <DataGridCell>
                        <b>Owners: </b>
                      </DataGridCell>
                      <DataGridCell>{owners}</DataGridCell>
                    </DataGridRow>
                    <DataGridRow>
                      <DataGridCell>
                        <b>Operators: </b>
                      </DataGridCell>
                      <DataGridCell>{operators}</DataGridCell>
                    </DataGridRow>
                  </DataGrid>
                </div>
              </div>

              <div className={DetailSection}>
                <p className={DetailSectionHeader}>
                  Vulnerabilities in this service
                </p>
                <div className="mt-4">
                  <ComponentsList
                    columns={{
                      name: {},
                      type: {},
                      version: {},
                      vulnerabilities: {},
                    }}
                    sorted
                    components={components}
                  />
                </div>
              </div>

              <div className={DetailSection}>
                <Stack alignment="center">
                  <p className={`${DetailSectionHeader} w-full`}>Patches log</p>
                  <Button
                    label="Add"
                    onClick={() =>
                      navigateTo(`${SERVICES_PATH}/${serviceId}/patchLog/new`)
                    }
                    size="small"
                  />
                </Stack>
                <div className="mt-4">
                  <PatchLogsList patches={patches} />
                </div>
              </div>

              <div className={DetailSection}>
                <Stack alignment="center">
                  <p className={`${DetailSectionHeader} w-full`}>Changes log</p>
                  <Button
                    label="Add"
                    onClick={() =>
                      navigateTo(`${SERVICES_PATH}/${serviceId}/patchLog/new`)
                    }
                    size="small"
                  />
                </Stack>
                <div className="mt-4">
                  <ChangesLogList changes={changes} />
                </div>
              </div>
            </>
          ) : (
            <HintNotFound
              text={`No details found for service id ${serviceId}`}
            />
          )}
        </>
      )}
    </Container>
  )
}

export default ServiceDetail
