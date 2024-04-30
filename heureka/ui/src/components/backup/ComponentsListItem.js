/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell, CheckboxRow } from "juno-ui-components"
import { Link } from "url-state-router"
import VulnerabilitiesOverview from "./VulnerabilitiesOverview"
import {
  classifyVulnerabilities,
  usersListToString,
  componentVersionByType,
} from "../helpers"
import { COMPONENTS_PATH } from "./AppRouter"
import CustomBadge from "./CustomBadge"

const ComponentsListItem = ({ item, columns, unlink, selectable }) => {
  const services = useMemo(() => {
    if (!item.Services) return []
    return item.Services
  }, [item.Services])

  const vulnerabilities = useMemo(() => {
    return classifyVulnerabilities(item)
  }, [item])

  const owners = useMemo(() => {
    return usersListToString(item.Owners)
  }, [item.Owners])

  const operators = useMemo(() => {
    return usersListToString(item.Operators)
  }, [item.Operators])

  return (
    <DataGridRow>
      {selectable && (
        <DataGridCell>
          <CheckboxRow
            id="selectable"
            label=" "
            onChange={function noRefCheck() {}}
          />
        </DataGridCell>
      )}
      {columns?.name && (
        <DataGridCell>
          {unlink ? (
            <>{item.Name}</>
          ) : (
            <Link
              to={`${COMPONENTS_PATH}/${item.ID}`}
              state={{ placeholderData: item }}
            >
              {item.Name}
            </Link>
          )}
        </DataGridCell>
      )}
      {columns?.type && <DataGridCell>{item.Type}</DataGridCell>}
      {columns?.version && (
        <DataGridCell>{componentVersionByType(item)}</DataGridCell>
      )}
      {columns?.vulnerabilities && (
        <DataGridCell>
          <VulnerabilitiesOverview vulnerabilities={vulnerabilities} />
        </DataGridCell>
      )}
      {columns?.belongsTo && (
        <DataGridCell>
          <CustomBadge icon="dns" label={services.length} />
        </DataGridCell>
      )}
      {columns?.owners && <DataGridCell>{owners}</DataGridCell>}
      {columns?.operators && <DataGridCell>{operators}</DataGridCell>}
    </DataGridRow>
  )
}

export default ComponentsListItem
