/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react"
import SilenceScheduled from "./SilenceScheduled"

import { MessagesProvider } from "messages-provider"
import { Button, Icon } from "juno-ui-components"
import { useSilenceTemplates } from "../../hooks/useAppStore.js"

const SilenceScheduledWrapper = () => {
  const templates = useSilenceTemplates()
  const [displayNewScheduledSilence, setDisplayNewScheduledSilence] =
    useState(false)

  // function which sets displayNewScheduledSilence to false
  const callbackOnClose = () => {
    setDisplayNewScheduledSilence(false)
  }

  return (
    <>
      {templates && templates?.length > 0 && (
        <MessagesProvider>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              setDisplayNewScheduledSilence(!displayNewScheduledSilence)
            }}
          >
            Schedule Silence
          </Button>
          {displayNewScheduledSilence && (
            <SilenceScheduled callbackOnClose={callbackOnClose} />
          )}
        </MessagesProvider>
      )}
    </>
  )
}

export default SilenceScheduledWrapper
