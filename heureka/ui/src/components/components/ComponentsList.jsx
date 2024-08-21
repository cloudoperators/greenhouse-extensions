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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Stack,
} from "@cloudoperators/juno-ui-components"
import HintNotFound from "../shared/HintNotFound"
import HintLoading from "../shared/HintLoading"
import ComponentsListItem from "./ComponentsListItem"

const ComponentsList = ({ items, isLoading }) => {
  return (
    <DataGrid minContentColumns={[2, 3]} columns={4}>
      <DataGridRow>
        <DataGridHeadCell>Name</DataGridHeadCell>
        <DataGridHeadCell>Type</DataGridHeadCell>
        <DataGridHeadCell>
          <Stack direction="vertical">
            <Tooltip triggerEvent="hover">
              <TooltipTrigger>Versions</TooltipTrigger>
              <TooltipContent>
                Total Number of Component Versions
              </TooltipContent>
            </Tooltip>
          </Stack>
        </DataGridHeadCell>

        <DataGridHeadCell>
          <Stack direction="vertical">
            <Tooltip triggerEvent="hover">
              <TooltipTrigger>Instances</TooltipTrigger>
              <TooltipContent>
                Total Number of Component Instances
              </TooltipContent>
            </Tooltip>
          </Stack>
        </DataGridHeadCell>
      </DataGridRow>
      {isLoading && !items ? (
        <DataGridRow>
          <DataGridCell colSpan={10}>
            <HintLoading className="my-4" text="Loading components..." />
          </DataGridCell>
        </DataGridRow>
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
