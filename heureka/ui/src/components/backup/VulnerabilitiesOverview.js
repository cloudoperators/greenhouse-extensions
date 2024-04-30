/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Icon, Badge } from "juno-ui-components"
import VulnerabilityBadge from "./VulnerabilityBadge"
import {
  THREAD_LEVEL_LOW,
  THREAD_LEVEL_MEDIUM,
  THREAD_LEVEL_HIGH,
  THREAD_LEVEL_CRITICAL,
} from "../helpers"

const VulnerabilitiesOverview = ({ vulnerabilities }) => {
  return (
    <div className="flex">
      {vulnerabilities.low > 0 && (
        <VulnerabilityBadge
          level={THREAD_LEVEL_LOW}
          label={vulnerabilities.low}
        />
      )}
      {vulnerabilities.medium > 0 && (
        <VulnerabilityBadge
          level={THREAD_LEVEL_MEDIUM}
          label={vulnerabilities.medium}
        />
      )}
      {vulnerabilities.high > 0 && (
        <VulnerabilityBadge
          level={THREAD_LEVEL_HIGH}
          label={vulnerabilities.high}
        />
      )}
      {vulnerabilities.critical > 0 && (
        <VulnerabilityBadge
          level={THREAD_LEVEL_CRITICAL}
          label={vulnerabilities.critical}
        />
      )}
    </div>
  )
}

export default VulnerabilitiesOverview
