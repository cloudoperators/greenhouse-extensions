/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Spinner, Stack } from "@cloudoperators/juno-ui-components"

const LoadElement = (prop) => {
  const elem = prop?.elem
  return (
    <>
      {elem ? (
        elem
      ) : (
        <Stack gap="2">
          <span>Loading</span>
          <Spinner variant="primary" />
        </Stack>
      )}
    </>
  )
}

export default LoadElement
