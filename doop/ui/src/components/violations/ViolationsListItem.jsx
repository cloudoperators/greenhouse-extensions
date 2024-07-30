/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import {
  Stack,
  Badge,
  DataGridRow,
  DataGridCell,
  Icon,
} from "@cloudoperators/juno-ui-components"
import {
  useDataDetailsViolationGroupKind,
  useDataActions,
} from "../StoreProvider"
import ViolationServicesCount from "./ViolationServicesCount"
import ViolationSeverity from "./ViolationSeverity"

const ViolationListItem = ({ item }) => {
  const detailsViolationGroupKind = useDataDetailsViolationGroupKind()
  const { setDetailsViolationGroupKind } = useDataActions()

  return (
    <DataGridRow
      className={`cursor-pointer ${
        detailsViolationGroupKind === item?.kind ? "active" : ""
      }`}
      onClick={() =>
        detailsViolationGroupKind === item.kind
          ? setDetailsViolationGroupKind(null)
          : setDetailsViolationGroupKind(item?.kind)
      }
    >
      <DataGridCell className="pl-0">
        <ViolationSeverity
          severities={item?.severities}
          className="pl-5"
          border
        />
      </DataGridCell>

      <DataGridCell className="font-bold">{item?.kind}</DataGridCell>
      <DataGridCell>
        <Badge text={`${item?.violationCount}`} className="" />
      </DataGridCell>
      <DataGridCell>
        <Stack gap="2" wrap>
          <ViolationServicesCount constraints={item?.constraints} />
        </Stack>
      </DataGridCell>
      <DataGridCell>
        <div>Template:</div>
        <div>
          {item?.constraints?.map(
            (c, i) =>
              c.metadata?.template_source && (
                <div key={i}>
                  <a
                    href={c.metadata.template_source}
                    target="_blank"
                    className="hover:underline"
                  >
                    <Stack gap="1.5" alignment="center">
                      <Icon icon="openInNew" size="16" />
                      {c.name}
                    </Stack>
                  </a>
                </div>
              )
          )}
        </div>

        <div>Constraint:</div>
        <div>
          {item?.constraints?.map(
            (c, i) =>
              c.metadata?.constraint_source && (
                <div key={i}>
                  <a
                    href={c.metadata.constraint_source}
                    target="_blank"
                    className="hover:underline"
                  >
                    <Stack gap="1.5" alignment="center">
                      <Icon icon="openInNew" size="16" />
                      {c.name}
                    </Stack>
                  </a>
                </div>
              )
          )}
        </div>
      </DataGridCell>
    </DataGridRow>
  )
}
export default ViolationListItem
