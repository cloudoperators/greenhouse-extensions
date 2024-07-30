/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { DateTime } from "luxon"

import { Spinner, Stack } from "@cloudoperators/juno-ui-components"

const statusBarStyles = `
  bg-theme-background-lvl-1
  py-1.5
  px-4
  my-px
  text-theme-light
`

const StatusBar = ({ totalCounts, isUpdating, updatedAt }) => {
  return (
    <Stack className={`status-bar ${statusBarStyles}`} alignment="center">
      <div>
        <span className="text-theme-default pr-2">{`${totalCounts.total} alerts`}</span>
        <span>{`(${totalCounts.critical || 0} critical, ${
          totalCounts.warning || 0
        } warning, ${totalCounts.info || 0} info)`}</span>
      </div>
      <Stack alignment="center" className="ml-auto">
        {isUpdating && <Spinner size="small" className="mr-2" />}
        {updatedAt &&
          `updated ${DateTime.fromMillis(updatedAt).toLocaleString({
            ...DateTime.TIME_24_WITH_SHORT_OFFSET,
          })}`}
      </Stack>
    </Stack>
  )
}

export default StatusBar
