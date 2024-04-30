/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  Icon,
  DataGrid,
  DataGridRow,
  DataGridCell,
  Container,
} from "juno-ui-components"
import { DetailSection, DetailSectionBox, DetailSectionHeader } from "../styles"
import { getServices, getUsers } from "../queries"
import useStore from "../hooks/useStore"
import ServicesList from "./ServicesList"
import HintLoading from "./HintLoading"
import UsersList from "./UsersList"
import { classifyVulnerabilitiesV2 } from "../helpers"
import VulnerabilitiesOverview from "./VulnerabilitiesOverview"

const ITEMS_PER_PAGE = 10

const Home = () => {
  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))
  const [servicesPaginationOptions, setServicesPaginationOptions] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  })
  const [servicesSearchOptions, setServicesSearchOptions] = useState({
    operators: "D038720",
  })
  const services = getServices(auth?.id_token, endpoint, {
    ...servicesPaginationOptions,
    ...servicesSearchOptions,
  })
  const [usersPaginationOptions, setUsersPaginationOptions] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  })
  const [usersSearchOptions, setUsersSearchOptions] = useState({
    // sapId: "D038720",
    sapId: "D058266",
  })
  const users = getUsers(auth?.id_token, endpoint, {
    ...usersPaginationOptions,
    ...usersSearchOptions,
  })

  // collect vulnerabilities
  const vulnerabilities = useMemo(() => {
    const result = []
    if (services.data?.Results) {
      services.data?.Results.forEach((service, i) => {
        if (service?.Components) {
          service?.Components.forEach((component) => {
            if (component?.Vulnerabilities) {
              result.push(component?.Vulnerabilities)
            }
          })
        }
      })
    }
    return classifyVulnerabilitiesV2(result.flat())
  }, [services.data])

  const onServicesPaginationChanged = (offset) => {
    setServicesSearchOptions({ ...servicesSearchOptions, offset: offset })
  }

  const onUsersPaginationChanged = (offset) => {
    setUsersPaginationOptions({ ...usersPaginationOptions, offset: offset })
  }

  return (
    <Container px={false}>
      <div className={DetailSection}>
        <div className={DetailSectionBox}>
          <DataGrid gridColumnTemplate="2fr 8fr">
            <DataGridRow>
              <DataGridCell>
                <b>Services: </b>
              </DataGridCell>
              <DataGridCell>{services.data?.Count}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridCell>
                <b>Vulnerabilities: </b>
              </DataGridCell>
              <DataGridCell>
                <VulnerabilitiesOverview vulnerabilities={vulnerabilities} />
              </DataGridCell>
            </DataGridRow>
          </DataGrid>
        </div>
      </div>
      <div className={DetailSection}>
        <p className={DetailSectionHeader}>Services</p>
        <p>List of services belonging to your support groups</p>
        <div className="mt-4">
          {services.isLoading && !services.data ? (
            <HintLoading text="Loading services..." />
          ) : (
            <>
              <ServicesList services={services.data?.Results} />
            </>
          )}
        </div>
      </div>
      <div className={DetailSection}>
        <p className={DetailSectionHeader}>Support groups</p>
        <p>List of support groups where you belong</p>
        <div className="mt-4">
          {users.isLoading && !users.data ? (
            <HintLoading text="Loading users..." />
          ) : (
            <>
              <UsersList users={users.data?.Results} />
            </>
          )}
        </div>
      </div>
    </Container>
  )
}

export default Home
