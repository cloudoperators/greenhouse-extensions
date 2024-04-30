/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Badge, Icon } from "juno-ui-components"

const CustomBadge = ({ badgeVariant, icon, label, className }) => {
  return (
    <Badge
      className={`pb-1 inline-block min-w-[3rem] ${className}`}
      variant={badgeVariant}
    >
      <Icon className="mr-2" size="15" icon={icon} />
      <span className="mt-0.5">{label}</span>
    </Badge>
  )
}

export default CustomBadge
