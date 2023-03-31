import React from "react"

import { Icon, Stack } from "juno-ui-components"

const severityStyles = (severity, count) => {
  let baseStyles = `
    px-2
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
      baseStyles += ` bg-theme-info/50`
      break
  }

  return baseStyles
}

const calculateCount = (total, suppressed) => {
  if (!total) return 0
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
      alignment="center"
      distribution="center"
      className={severityStyles(severity, severityCountTotal)}
    >
      <div>{calculateCount(severityCountTotal, severityCountSuppressed)}</div>
      {severityCountSuppressed && (
        <Stack alignment="center" className="text-xs opacity-80">
          <Icon icon="notificationsOff" size="0.75rem" />
          <span>{severityCountSuppressed}</span>
        </Stack>
      )}
    </Stack>
  )
}

export default RegionSeverity
