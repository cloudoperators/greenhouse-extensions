/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from "react"
import { DataGridRow, DataGridCell, Pill, Stack } from "juno-ui-components"
import SilencesTimestamp from "./shared/SilencesTimestamp"

import {
  useSilencesActions,
  useShowDetailsForSilence,
} from "../../hooks/useAppStore"
import ExpireSilence from "./ExpireSilence"

// function that cuts the value of a string to max 40 characters
const cutString = (str) => {
  return str.length > 40 ? str.substring(0, 40) + "..." : str
}

const SilencesItem = ({ silence }, ref) => {
  const { setShowDetailsForSilence } = useSilencesActions()
  const showDetailsFor = useShowDetailsForSilence()

  // handle show details
  const handleShowDetails = (e) => {
    e.stopPropagation()
    e.preventDefault()
    showDetailsFor === silence?.id
      ? setShowDetailsForSilence(false)
      : setShowDetailsForSilence(silence?.id)
  }

  return (
    <DataGridRow
      className={`cursor-pointer ${
        showDetailsFor === silence?.id ? "active" : ""
      } `}
      onClick={(e) => handleShowDetails(e)}
    >
      <DataGridCell>
        <SilencesTimestamp timestamp={silence?.startsAt} />
        <SilencesTimestamp timestamp={silence?.endsAt} />
      </DataGridCell>
      <DataGridCell className="overflow-hidden">
        <div ref={ref}>{silence?.comment}</div>
        <div className="text-theme-light">Created by {silence?.createdBy}</div>
      </DataGridCell>
      <DataGridCell className="overflow-hidden">
        <Stack gap="2" alignment="start" wrap={true}>
          {silence?.matchers?.map((matcher, index) => (
            <Pill
              key={index}
              pillKey={matcher.name}
              pillValue={cutString(matcher.value)}
            />
          ))}
        </Stack>
      </DataGridCell>
    </DataGridRow>
  )
}

export default forwardRef(SilencesItem)
