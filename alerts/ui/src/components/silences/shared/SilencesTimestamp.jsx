/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { DateTime } from "luxon"

//get start and end time of the silence

const SilencesTimestamp = ({ timestamp }) => {
  const dateFormat = { ...DateTime.DATE_MED }
  const timeFormat = { ...DateTime.TIME_24_WITH_SHORT_OFFSET }

  const timeformatted = DateTime.fromISO(timestamp)
  const formattedTime = `${timeformatted.toLocaleString(
    dateFormat
  )} ${timeformatted.toLocaleString(timeFormat)}`

  return <div>{formattedTime}</div>
}
export default SilencesTimestamp
