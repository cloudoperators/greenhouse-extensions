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
} from "@cloudoperators/juno-ui-components"
import HintNotFound from "../shared/HintNotFound"
import ServicesListItem from "./ServicesListItem"
import HintLoading from "../shared/HintLoading"

const ServicesList = ({ services, isLoading }) => {
  return (
    <>
      <DataGrid gridColumnTemplate="2fr 3fr 2fr 2fr 2fr">
        <DataGridRow>
          <DataGridHeadCell>Service</DataGridHeadCell>
          <DataGridHeadCell>Owners</DataGridHeadCell>
          <DataGridHeadCell>Support Groups</DataGridHeadCell>
          <DataGridHeadCell>Component Instances Count</DataGridHeadCell>
          <DataGridHeadCell>Total Vulnerability Matches</DataGridHeadCell>
        </DataGridRow>
        {isLoading && !services ? (
          <HintLoading className="my-4" text="Loading services..." />
        ) : (
          <>
            {services?.length > 0 ? (
              <>
                {services.map((item, i) => (
                  <ServicesListItem key={i} item={item} />
                ))}
              </>
            ) : (
              <DataGridRow>
                <DataGridCell colSpan={5}>
                  <HintNotFound text="No services found" />
                </DataGridCell>
              </DataGridRow>
            )}
          </>
        )}
      </DataGrid>
    </>
  )
}
export default ServicesList
