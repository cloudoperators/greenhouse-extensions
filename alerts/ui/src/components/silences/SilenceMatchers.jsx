import React, { useMemo } from "react"

import { Pill, Stack } from "juno-ui-components"

// Matchers can be clicked if the matcher is configurable
const SilenceMatchers = ({ matchers, onCloseCallback }) => {
  // sort matchers by exclude flag
  const sortedMatchers = useMemo(() => {
    if (!matchers || matchers?.length <= 0) return []
    return matchers.sort((a, b) => a.configurable - b.configurable)
  }, [matchers])

  return (
    <Stack gap="2" alignment="start" wrap={true}>
      {sortedMatchers.length > 0 ? (
        matchers.map((matcher) => {
          return (
            <Pill
              className={matcher.configurable ? "opacity-100" : "opacity-70"}
              closeable={!!matcher.configurable}
              onClose={() => onCloseCallback(matcher)}
              key={matcher.name}
              pillKey={matcher.name}
              pillValue={matcher.value}
            />
          )
        })
      ) : (
        <span className="opacity-70">No matchers found</span>
      )}
    </Stack>
  )
}

export default SilenceMatchers
