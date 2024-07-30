/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import {
  Stack,
  Button,
  Spinner,
  Message,
} from "@cloudoperators/juno-ui-components"

import {
  useAuthError,
  useAuthLoggedIn,
  useAuthIsProcessing,
  useAuthAppLoaded,
  useAuthActions,
} from "./StoreProvider"

const AuthProvider = ({ children }) => {
  const { login } = useAuthActions()
  const authIsProcessing = useAuthIsProcessing()
  const isLoggedIn = useAuthLoggedIn()
  const error = useAuthError()
  const authAppLoaded = useAuthAppLoaded()

  if (isLoggedIn) return children

  return (
    <Stack
      alignment="center"
      distribution="center"
      direction="vertical"
      className="my-[10vh]"
    >
      <p className="text-xl">Welcome to the Doop Dashboard!</p>
      {error ? (
        <Message variant="danger" text={error} />
      ) : !authAppLoaded ? (
        <p className="text-xl">Waiting for Auth App</p>
      ) : authIsProcessing ? (
        <Spinner />
      ) : (
        <>
          <p className="text-xl">Please sign in to continue.</p>
          <Button
            label="Sign in"
            variant="primary"
            onClick={login}
            className="mt-2"
          />
        </>
      )}
    </Stack>
  )
}
export default AuthProvider
