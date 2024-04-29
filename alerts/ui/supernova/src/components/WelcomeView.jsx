/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Stack, Button, Spinner } from "juno-ui-components"
import { useAuthIsProcessing, useAuthActions } from "../hooks/useAppStore"

const WelcomeView = () => {
  const { login } = useAuthActions()
  const authIsProcessing = useAuthIsProcessing()
  return (
    <Stack
      alignment="center"
      distribution="center"
      direction="vertical"
      className="my-[10vh]"
    >
      <p className="text-xl">Welcome to the Converged Cloud Alertmanager</p>
      {authIsProcessing ? (
        <Spinner />
      ) : (
        <>
          <p className="text-xl">Login to track and manage your alerts</p>
          <Button
            label="Login"
            variant="primary"
            onClick={login}
            className="mt-2"
          />
        </>
      )}
    </Stack>
  )
}

export default WelcomeView
