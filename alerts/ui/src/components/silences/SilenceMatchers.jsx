/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"

import { Pill, Stack } from "@cloudoperators/juno-ui-components"

// Matchers can be clicked if the matcher is configurable
const SilenceMatchers = ({ matchers, onClickCallback, closeable }) => {
  // sort matchers by exclude flag
  const sortedMatchers = useMemo(() => {
    if (!matchers || matchers?.length <= 0) return []
    return matchers.sort((a, b) => a.configurable - b.configurable)
  }, [matchers])

  // closeable --> display x in the pill: is true if the matcher is configurable and just in case is excluded
  // clickable --> is true if the matcher is configurable
  // conditionally add click and close handlers only if the matcher is configurable (this is important,
  // because the Pill component styles reacts on the presence of an onClick handler)
  const clickProps = (matcher) => {
    const props = {
      onClick: () => matcher.configurable && onClickCallback(matcher),
      onClose: () => onClickCallback(matcher),
    }
    if (matcher.configurable) {
      return props
    } else {
      return {}
    }
  }

  return (
    <Stack gap="2" alignment="start" wrap={true}>
      {sortedMatchers.length > 0 ? (
        matchers.map((matcher) => {
          return (
            <Pill
              className={matcher.configurable ? "opacity-100" : "opacity-70"}
              closeable={matcher.configurable && closeable}
              {...clickProps(matcher)}
              key={matcher.name}
              pillKey={matcher.name}
              pillValue={matcher.value}
            />
          )
        })
      ) : (
        <span className="text-theme-light">No excluded matchers found</span>
      )}
    </Stack>
  )
}

export default SilenceMatchers
