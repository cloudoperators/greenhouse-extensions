import React, { useState } from "react"
import { Stack, Icon } from "juno-ui-components"
import SilenceMatchers from "./SilenceMatchers"

const detailsCss = (show) => {
  return `
      transition-all
      ease-out
      max-h-0
      overflow-y-scroll
			${show ? "duration-1000 max-h-[34rem]" : `duration-300`}
		`
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
}

const SilenceNewAdvanced = ({ matchers, onMatchersChanged }) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <div className="advance-link mt-4">
        <a
          href="#"
          rel="noopener noreferrer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Stack alignment="center">
            Advanced options
            <Icon
              color="jn-global-text"
              icon={showDetails ? "expandLess" : "expandMore"}
            />
          </Stack>
        </a>
      </div>

      <div className="advance-area overflow-hidden">
        <div className={detailsCss(showDetails)}>
          <p className="mt-2">Matchers attached to this silence</p>
          <div className="mt-2">
            <SilenceMatchers
              matchers={matchers.filter((m) => !m.excluded)}
              onCloseCallback={onMatchersChanged}
            />
          </div>
          <p className="mt-4">
            The default silence configuration excludes the following matchers.
            This means that any alerts triggered by these matchers can be
            silenced together. If you want to include any of these matchers in
            the default configuration, simply click on them.
          </p>
          <div className="my-2">
            <SilenceMatchers
              matchers={matchers.filter((m) => m.excluded)}
              onCloseCallback={onMatchersChanged}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default SilenceNewAdvanced
