/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "@cloudoperators/juno-ui-components"
import HintNotFound from "../shared/HintNotFound"
import HintLoading from "../shared/HintLoading"
import ComponentsListItem from "./ComponentsListItem"

const ComponentsList = ({ items, isLoading }) => {
  console.log("components", items)
  return (
    <DataGrid columns={3}>
      <DataGridRow>
        <DataGridHeadCell>Name</DataGridHeadCell>
        <DataGridHeadCell>Type</DataGridHeadCell>
        <DataGridHeadCell>Total Number of Versions</DataGridHeadCell>
      </DataGridRow>
      {isLoading && !items ? (
        <HintLoading className="my-4" text="Loading components..." />
      ) : (
        <>
          {items?.length > 0 ? (
            <>
              {items.map((item, index) => (
                <ComponentsListItem
                  key={index}
                  item={item}
                ></ComponentsListItem>
              ))}
            </>
          ) : (
            <DataGridRow>
              <DataGridCell colSpan={10}>
                <HintNotFound text="No components found" />
              </DataGridCell>
            </DataGridRow>
          )}
        </>
      )}
    </DataGrid>
  )
}

export default ComponentsList
