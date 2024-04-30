/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Stack, Button } from "juno-ui-components"

const WelcomeView = ({ loginCallback }) => {
  return (
    <Stack
      alignment="center"
      distribution="center"
      direction="vertical"
      className="my-[10vh]"
    >
      <p className="text-xl">
        Welcome to the Converged Cloud Patch Management System
      </p>
      <p className="text-xl">Login to maintain & track vulnerabilities</p>
      <Button
        label="Login"
        variant="primary"
        onClick={loginCallback}
        className="mt-2"
      />
    </Stack>
  )
}

export default WelcomeView
