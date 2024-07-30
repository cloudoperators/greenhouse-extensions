/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import FilterPill from "../shared/FilterPill"
import { valueToLabel } from "../../lib/helpers"
import { Stack } from "@cloudoperators/juno-ui-components"

const ViolationDetailsPills = ({ violation }) => {
  if (!violation?.object_identity) return null

  return (
    <Stack direction="vertical" gap="2">
      {Object.keys(violation.object_identity).map((key, i) => (
        <div key={key} className="whitespace-nowrap">
          <FilterPill
            name={key}
            value={valueToLabel(violation.object_identity[key])}
          />
        </div>
      ))}
      {violation.severity && (
        <div className="whitespace-nowrap">
          <FilterPill name="severity" value={violation.severity} />
        </div>
      )}
    </Stack>
  )
}

export default ViolationDetailsPills
