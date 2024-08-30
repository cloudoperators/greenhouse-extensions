/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, useRef } from "react"

import { DataGridCell, DataGridRow } from "@cloudoperators/juno-ui-components"

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
  const rowRef = useRef(null)

  const handleShowDetails = (e) => {
    // Using the rowRef to check what was clicked
    // if the click was not on the row itself or on the row's direct children (i.e. the cells)
    // then we don't want to show the details because then the click was on a child of one of the cells
    // an additional check is made for targets with className "interactive" and for targets where a parent has className "interactive". 
    // If either the target itself or one of its parents has the "interactive" class then the click
    // handling should proceed even if the previous condition was true
    // TODO: This is pretty hacky, we need to come up with a better solution for this
    if (
      e.target.parentNode !== rowRef.current &&
      !e.target.classList.contains("interactive") &&
      !e.target.closest(".interactive")
    )
      return

    e.stopPropagation()
    e.preventDefault()
    setShowDetailsFor(alert?.fingerprint)
  }

  return (
    <DataGridRow
      className={`cursor-pointer ${
        useShowDetailsFor() === alert?.fingerprint ? "active" : ""
      }`}
      ref={rowRef}
      onClick={(e) => handleShowDetails(e)}
    >
      <DataGridCell className="pl-0 interactive">
        <div className={cellSeverityClasses(alert.labels?.severity)}>
          <AlertIcon ref={ref} severity={alert.labels?.severity} />
        </div>
      </DataGridCell>
      <DataGridCell className="interactive">
        <AlertRegion
          region={alert.labels?.region}
          cluster={alert.labels?.cluster}
        />
      </DataGridCell>
      <DataGridCell>{alert.labels?.service}</DataGridCell>
      <DataGridCell className="cursor-default">
        <div className="interactive text-theme-high cursor-pointer">
          {alert.annotations?.summary}
        </div>
        <div>
          <AlertDescription
            description={alert.annotations?.description}
            subdued={true}
          />
          <AlertLinks alert={alert} className="mb-4 mt-1" />
        </div>
        <AlertLabels alert={alert} />
      </DataGridCell>
      <DataGridCell className="interactive">
        <AlertTimestamp
          startTimestamp={alert.startsAt}
        />
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
