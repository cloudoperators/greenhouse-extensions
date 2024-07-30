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

const ComponentsList = ({ components, isLoading }) => {
  return (
    <DataGrid columns={3}>
      <DataGridRow>
        <DataGridHeadCell>Name</DataGridHeadCell>
        <DataGridHeadCell>Type</DataGridHeadCell>
        <DataGridHeadCell>Versions</DataGridHeadCell>
      </DataGridRow>
      {isLoading && !components ? (
        <HintLoading className="my-4" text="Loading components..." />
      ) : (
        <>
          {components?.length > 0 ? (
            <>
              {components.map((item, index) => (
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
