/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  Stack,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "juno-ui-components"
import ServicesListItem from "./ServicesListItem"
import HintNotFound from "./HintNotFound"

const ServicesList = ({ services, minimized }) => {
  services = useMemo(() => {
    if (!services) return []
    return services
  }, [services])

  return (
    <>
      <DataGrid gridColumnTemplate={minimized ? "2fr" : "2fr 3fr 2fr 2fr 1fr"}>
        <DataGridRow>
          <DataGridHeadCell>Name</DataGridHeadCell>
          {!minimized && (
            <>
              <DataGridHeadCell>Support group</DataGridHeadCell>
              <DataGridHeadCell>Operators</DataGridHeadCell>
              <DataGridHeadCell>Vulnerabilities</DataGridHeadCell>
              <DataGridHeadCell>Components</DataGridHeadCell>
            </>
          )}
        </DataGridRow>
        {services.length > 0 ? (
          <>
            {services.map((item, i) => (
              <ServicesListItem key={i} item={item} minimized={minimized} />
            ))}
          </>
        ) : (
          <DataGridRow>
            <DataGridCell colSpan={minimized ? 1 : 5}>
              <HintNotFound text="No services found" />
            </DataGridCell>
          </DataGridRow>
        )}
      </DataGrid>
    </>
  )
}

export default ServicesList
