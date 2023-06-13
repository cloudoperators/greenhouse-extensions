import React, { forwardRef } from "react"
import { DateTime } from "luxon"
import { Markup } from "interweave"
import {
  Button,
  DataGridCell,
  DataGridRow,
  Icon,
  Stack,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "juno-ui-components"

import AlertLabels from "./AlertLabels"
import AlertLinks from "./AlertLinks"
import AlertSilence from "./AlertSilence"
import { descriptionParsed } from "../../lib/utils"

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
  const dateFormat = { ...DateTime.DATE_MED }
  const timeFormat = { ...DateTime.TIME_24_WITH_SHORT_OFFSET }
  const startTime = DateTime.fromISO(alert.startsAt)
  const daysFiring = DateTime.now().diff(startTime, "days")

  return (
    <DataGridRow>
      <DataGridCell className="pl-0">
        <div className={cellSeverityClasses(alert.labels?.severity)}>
          {alert.labels?.severity === "critical" ? (
            <Icon ref={ref} icon="danger" color="text-theme-danger" />
          ) : alert.labels?.severity.match(/^(warning|info)$/) ? (
            <Icon
              ref={ref}
              icon={alert.labels?.severity}
              color={`text-theme-${alert.labels?.severity}`}
            />
          ) : (
            <Icon ref={ref} icon="errorOutline" />
          )}
        </div>
      </DataGridCell>
      <DataGridCell>
        {alert.labels?.region}
        {alert.labels?.region !== alert.labels?.cluster && (
          <>
            <br />
            <span className="text-theme-light">{alert.labels?.cluster}</span>
          </>
        )}
      </DataGridCell>
      <DataGridCell>{alert.labels?.service}</DataGridCell>
      <DataGridCell>
        <div>{alert.annotations?.summary}</div>
        <div>
          <Markup
            content={descriptionParsed(
              alert.annotations?.description?.replace(
                /`([^`]+)`/g,
                "<code class='inline-code'>$1</code>"
              )
            )}
            tagName="div"
            className="text-theme-light"
          />
          <AlertLinks alert={alert} className="mb-4 mt-1" />
        </div>
        <AlertLabels alert={alert} />
      </DataGridCell>
      <DataGridCell>
        <Stack direction="vertical" gap="1">
          <div>{startTime.toLocaleString(dateFormat)}</div>
          <div>{startTime.toLocaleString(timeFormat)}</div>
          {daysFiring.days > 7 && (
            <Tooltip variant="warning" triggerEvent="hover">
              <TooltipTrigger asChild>
                <Icon icon="warning" color="text-theme-warning" />
              </TooltipTrigger>
              <TooltipContent>
                {`Alert has been firing for ${Math.round(
                  daysFiring.days
                )} days`}
              </TooltipContent>
            </Tooltip>
          )}
        </Stack>
      </DataGridCell>
      <DataGridCell>{alert.labels?.status}</DataGridCell>
      <DataGridCell>
        <AlertSilence alert={alert} />
      </DataGridCell>
    </DataGridRow>
  )
}

export default forwardRef(Alert)
