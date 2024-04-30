/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { DataGridRow, DataGridCell } from "juno-ui-components"
import { Link } from "url-state-router"
import { classifyVulnerabilities } from "../helpers"
import VulnerabilitiesOverview from "./VulnerabilitiesOverview"
import { SERVICES_PATH } from "./AppRouter"
import CustomBadge from "./CustomBadge"

const cellClasses = `
justify-start
`

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

const ServicesListItem = ({ item, minimized }) => {
  const owners = useMemo(() => {
    return listOfUsers(item.Owners)
  }, [item.Owners])

  const operators = useMemo(() => {
    return listOfUsers(item.Operators)
  }, [item.Operators])

  const components = useMemo(() => {
    if (!item?.Components) return []
    return item.Components
  }, [item.Components])

  const vulnerabilities = useMemo(() => {
    return classifyVulnerabilities(components)
  }, [components])

  return (
    <DataGridRow>
      <DataGridCell className={cellClasses}>
        <Link to={`${SERVICES_PATH}/${item.ID}`}>{item.Name}</Link>
      </DataGridCell>
      {!minimized && (
        <>
          <DataGridCell className={cellClasses}>{owners}</DataGridCell>
          <DataGridCell className={cellClasses}>{operators}</DataGridCell>
          <DataGridCell className={cellClasses}>
            <VulnerabilitiesOverview vulnerabilities={vulnerabilities} />
          </DataGridCell>
          <DataGridCell className={cellClasses}>
            <div>
              <CustomBadge icon="widgets" label={components.length} />
            </div>
          </DataGridCell>
        </>
      )}
    </DataGridRow>
  )
}

export default ServicesListItem
