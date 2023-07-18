import React, { useMemo } from "react"

import { Pill, Stack } from "juno-ui-components"

// Matchers can be clicked if the matcher is configurable
const SilenceMatchers = ({ matchers, onClickCallback, closeable }) => {
  console.log("matchers:::::", matchers)

  // sort matchers by exclude flag
  const sortedMatchers = useMemo(() => {
    if (!matchers || matchers?.length <= 0) return []
    return matchers.sort((a, b) => a.configurable - b.configurable)
  }, [matchers])

  // cloaseable --> display x in the pill: is true if the matcher is configurable and just in case is excluded
  // clickable --> is true if the matcher is configurable
  return (
    <Stack gap="2" alignment="start" wrap={true}>
      {sortedMatchers.length > 0 ? (
        matchers.map((matcher) => {
          return (
            <Pill
              className={matcher.configurable ? "opacity-100" : "opacity-70"}
              closeable={matcher.configurable && closeable}
              onClose={() => onClickCallback(matcher)}
              onClick={() => matcher.configurable && onClickCallback(matcher)}
              key={matcher.name}
              pillKey={matcher.name}
              pillValue={matcher.value}
            />
          )
        })
      ) : (
        <span className="opacity-70">No excluded matchers found</span>
      )}
    </Stack>
  )
}

export default SilenceMatchers
