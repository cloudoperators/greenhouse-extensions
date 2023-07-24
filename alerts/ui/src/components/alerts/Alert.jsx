import React, { forwardRef } from "react"

import { DataGridCell, DataGridRow } from "juno-ui-components"

import { useGlobalsActions, useShowDetailsFor } from "../../hooks/useAppStore"
import AlertLabels from "./shared/AlertLabels"
import AlertLinks from "./shared/AlertLinks"
import SilenceNew from "../silences/SilenceNew"
import AlertIcon from "./shared/AlertIcon"
import AlertDescription from "./shared/AlertDescription"
import AlertTimestamp from "./shared/AlertTimestamp"
import AlertStatus from "./AlertStatus"
import AlertRegion from "./shared/AlertRegion"

const cellSeverityClasses = (severity) => {
  let borderColor = "border-text-theme-default"
  switch (severity) {
    case "critical":
      borderColor = "border-theme-danger"
      break
    case "warning":
      borderColor = "border-theme-warning"
      break
    case "info":
      borderColor = "border-theme-info"
      break
  }

  return `
    border-l-2
    ${borderColor}
    h-full
    pl-5
  `
}

const Alert = ({ alert }, ref) => {
  const { setShowDetailsFor } = useGlobalsActions()

  const handleShowDetails = (e) => {
    e.preventDefault()
    setShowDetailsFor(alert?.fingerprint)
  }

  return (
    <DataGridRow
      className={`cursor-pointer ${
        useShowDetailsFor() === alert?.fingerprint ? "active" : ""
      }`}
      onClick={(e) => handleShowDetails(e)}
    >
      <DataGridCell className="pl-0">
        <div className={cellSeverityClasses(alert.labels?.severity)}>
          <AlertIcon ref={ref} severity={alert.labels?.severity} />
        </div>
      </DataGridCell>
      <DataGridCell>
        <AlertRegion
          region={alert.labels?.region}
          cluster={alert.labels?.cluster}
        />
      </DataGridCell>
      <DataGridCell>{alert.labels?.service}</DataGridCell>
      <DataGridCell>
        <div className="text-theme-high">{alert.annotations?.summary}</div>
        <div>
          <AlertDescription
            description={alert.annotations?.description}
            subdued={true}
          />
          <AlertLinks alert={alert} className="mb-4 mt-1" />
        </div>
        <AlertLabels alert={alert} />
      </DataGridCell>
      <DataGridCell>
        <AlertTimestamp startTimestamp={alert.startsAt} />
      </DataGridCell>
      <DataGridCell>
        <AlertStatus alert={alert} />
      </DataGridCell>
      <DataGridCell>
        <SilenceNew alert={alert} size="small" />
      </DataGridCell>
    </DataGridRow>
  )
}

export default forwardRef(Alert)
