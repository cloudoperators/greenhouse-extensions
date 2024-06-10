/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from "react"
import {
  DataGridRow,
  DataGridCell,
  Pill,
  Stack,
  Container,
} from "juno-ui-components"
import SilencesTimestamp from "./shared/SilencesTimestamp"
import constants from "../../constants"

import ExpireSilence from "./ExpireSilence"
import RecreateSilence from "./RecreateSilence"

// function that cuts the value of a string to max 40 characters
const cutString = (str) => {
  return str.length > 40 ? str.substring(0, 40) + "..." : str
}

const SilencesItem = ({ silence }, ref) => {
  return (
    <DataGridRow onClick={(e) => handleShowDetails(e)}>
      <DataGridCell>
        <SilencesTimestamp timestamp={silence?.startsAt} />
        <SilencesTimestamp timestamp={silence?.endsAt} />
      </DataGridCell>
      <DataGridCell className="overflow-hidden">
        <div ref={ref}>{silence?.comment}</div>
        <div className="text-theme-light">
          Silence {silence.id} created by {silence?.createdBy}
        </div>
        <Container className="py-2 px-0">
          <Stack gap="2" alignment="start" wrap={true}>
            {silence?.matchers?.map((matcher, index) => (
              <Pill
                key={index}
                pillKey={matcher.name}
                pillValue={cutString(matcher.value)}
              />
            ))}
          </Stack>
        </Container>
      </DataGridCell>
      <DataGridCell className="overflow-hidden">
        <p>{silence?.status?.state}</p>
      </DataGridCell>
      <DataGridCell className="overflow-hidden">
        {
          /// show the expire button only if the silence is active or pending
          silence?.status?.state === constants.SILENCE_ACTIVE ||
          silence?.status?.state === constants.SILENCE_PENDING ? (
            <ExpireSilence silence={silence} />
          ) : (
            <RecreateSilence silence={silence} />
          )
        }
      </DataGridCell>
    </DataGridRow>
  )
}

export default forwardRef(SilencesItem)
