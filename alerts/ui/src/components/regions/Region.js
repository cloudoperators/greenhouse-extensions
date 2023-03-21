import React from "react"

import { Stack } from "juno-ui-components"

const regionStyles = `
  grid
  grid-cols-[repeat(4,_minmax(5rem,_1fr))]
  bg-theme-background-lvl-1
`

const regionHeader = `
  bg-theme-background-lvl-2
  font-bold
  py-2
  px-3
  whitespace-nowrap
`

const severityStyles = (severity, count) => {
  let baseStyles = `
    py-2
    px-3
  `
  if (count === 0) {
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

const Region = ({region, severityCounts}) => {
  return (
    <div className={`region ${regionStyles}`}>
      <Stack alignment="center" distribution="center" className={regionHeader}>{region}</Stack>
      <Stack alignment="center" distribution="center" className={severityStyles("critical", severityCounts.critical)}>{severityCounts.critical}</Stack>
      <Stack alignment="center" distribution="center" className={severityStyles("warning", severityCounts.warning)}>{severityCounts.warning}</Stack>
      <Stack alignment="center" distribution="center" className={severityStyles("info", severityCounts.info)}>{severityCounts.info}</Stack>
    </div>
  )
}

export default Region