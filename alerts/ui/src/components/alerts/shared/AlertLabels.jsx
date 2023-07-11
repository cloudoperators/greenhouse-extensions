import React from "react"

import { Pill, Stack } from "juno-ui-components"

import { useFilterLabels } from "../../../hooks/useAppStore"

/**
 * For each of the given alert's labels which is included in the configured filterLabels render a Pill showing filterLabel and filterValue
 */
const AlertLabels = ({ alert }) => {
  const filterLabels = useFilterLabels()

  return (
    <Stack gap="2" alignment="start" wrap={true}>
      {filterLabels.map((filterLabel) => {
        let value = alert?.labels?.[filterLabel]

        return (
          value && (
            <Pill key={filterLabel} pillKey={filterLabel} pillValue={value} />
          )
        )
      })}
    </Stack>
  )
}

export default AlertLabels
