import React from "react"
import { DateTime } from "luxon"

import { Spinner, Stack } from "juno-ui-components"

const StatusBar = ({totalCounts, isUpdating, updatedAt}) => {

  return (
    <Stack className="bg-theme-background-lvl-2 py-1.5 px-4 text-theme-light" alignment="center">
    <div>
      <span className="text-theme-default pr-2">{`${totalCounts.total} alerts`}</span>
      <span>{`(${totalCounts.critical} critical, ${totalCounts.warning} warning, ${totalCounts.info} info)`}</span>
    </div>
    <Stack alignment="center" className="ml-auto">
      {isUpdating &&
        <Spinner size="small" className="mr-2" />
      }
      {updatedAt &&
        `updated ${DateTime.fromMillis(updatedAt).toLocaleString({...DateTime.TIME_24_WITH_SHORT_OFFSET})}`
      }
    </Stack>
  </Stack>
  )
}

export default StatusBar