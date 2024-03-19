/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import FilterPill from "../shared/FilterPill"

const ViolationServicesCount = ({ constraints, slice }) => {
  const serviceCounts = React.useMemo(() => {
    const counts = {}
    constraints.forEach((constraint) =>
      constraint.violation_groups.forEach((vg) => {
        const serviceName = vg.pattern?.object_identity?.service
        if (serviceName) counts[serviceName] = (counts[serviceName] || 0) + 1
      })
    )

    return counts
  }, [constraints])

  return (
    <>
      {Object.keys(serviceCounts).map(
        (service, i) =>
          (!slice || i < slice) && (
            <FilterPill
              key={i}
              name="service"
              value={service}
              valueLabel={`${service} | ${serviceCounts[service]}`}
            />
          )
      )}
      {Object.keys(serviceCounts).length > slice && "..."}
    </>
  )
}

export default ViolationServicesCount
