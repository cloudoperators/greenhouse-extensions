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

const ServicesList = ({ items, isLoading }) => {
  return (
    <>
      <DataGrid gridColumnTemplate="2fr 3fr 2fr 2fr 2fr">
        <DataGridRow>
          <DataGridHeadCell>Service</DataGridHeadCell>
          <DataGridHeadCell>Owners</DataGridHeadCell>
          <DataGridHeadCell>Support Groups</DataGridHeadCell>
          <DataGridHeadCell>
            Total Number of Component Instances
          </DataGridHeadCell>
          <DataGridHeadCell>Total Number of Issue Matches</DataGridHeadCell>
        </DataGridRow>
        {isLoading && !items ? (
          <HintLoading className="my-4" text="Loading services..." />
        ) : (
          <>
            {items?.length > 0 ? (
              <>
                {items.map((item, i) => (
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
