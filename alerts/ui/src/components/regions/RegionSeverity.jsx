/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Icon, Stack } from "juno-ui-components"

const severityStyles = (severity, count) => {
  let baseStyles = `
    text-lg/5
  `
  if (!count || count < 1) {
    return `${baseStyles} text-theme-light`
  }

  switch (severity) {
    case "critical":
      baseStyles += ` bg-theme-danger/50`
      break
    case "warning":
      baseStyles += ` bg-theme-warning/50`
      break
    case "info":
      baseStyles += ` bg-theme-info/40`
      break
  }

  return baseStyles
}

const calculateCount = (total, suppressed) => {
  if (!total) return "--"
  return suppressed ? total - suppressed : total
}

const RegionSeverity = ({
  severity,
  severityCountTotal,
  severityCountSuppressed,
}) => {
  return (
    <Stack
      direction="vertical"
      alignment="stretch"
      distribution="center"
      className={severityStyles(severity, severityCountTotal)}
    >
      <Stack direction="vertical" alignment="center" distribution="center" className="h-full">{calculateCount(severityCountTotal, severityCountSuppressed)}</Stack>
      {severityCountSuppressed && (
        <div className="text-xs bg-black/10 mt-auto">
          <Stack alignment="center" distribution="center">
            <Icon icon="notificationsOff" size="0.75rem" />
            <span>{severityCountSuppressed}</span>
          </Stack>
        </div>
      )}
    </Stack>
  )
}

export default RegionSeverity
