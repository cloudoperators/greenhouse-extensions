import React from "react"

import { Pill, Stack } from "juno-ui-components"

import useStore from "../../hooks/useStore"

const AlertLabels = ({alert}) => {
  const filterKeys = useStore((state) => state.filters.keys)

  return (
    <Stack gap="2" alignment="start" wrap={true}>
      {filterKeys.map(key => {
        let value = alert.labels?.[key]
        // return `${key}: ${value}`
        return value &&
          <Pill key={key} pillKey={key} pillValue={value} />
      })}
    </Stack>
  )
}

export default AlertLabels