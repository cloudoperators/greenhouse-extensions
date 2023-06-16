import React from "react"
import { DateTime } from "luxon"

import { Icon, Stack, Tooltip, TooltipContent, TooltipTrigger } from "juno-ui-components"


const AlertTimestamp = ({startTimestamp}) => {
  const dateFormat = { ...DateTime.DATE_MED }
  const timeFormat = { ...DateTime.TIME_24_WITH_SHORT_OFFSET }
  const startTime = DateTime.fromISO(startTimestamp)
  const daysFiring = DateTime.now().diff(startTime, "days")

  return (
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
  )

}
export default AlertTimestamp