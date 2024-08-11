/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useLayoutEffect } from "react"

import {
  AppShellProvider,
  ContentHeading,
} from "@cloudoperators/juno-ui-components"
import AppContent from "./components/AppContent"
import styles from "./styles.scss"
import AuthProvider from "./components/AuthProvider"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import StoreProvider from "./components/StoreProvider"
import AsyncWorker from "./components/AsyncWorker"
import { AppShell } from "@cloudoperators/juno-ui-components"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { fetchProxyInitDB } from "@cloudoperators/juno-utils"
import db from "../db.json"
import { useGlobalsActions } from "./components/StoreProvider"

const App = (props = {}) => {
  const { setEndpoint, setMock } = useGlobalsActions()
  const isMock = useMemo(
    () => props.isMock === true || props.isMock === "true",
    [props.isMock]
  )
  // setup the mock db.json
  useEffect(() => {
    if (isMock) {
      setMock(true)

      fetchProxyInitDB(db, {
        debug: true,
        rewriteRoutes: {
          "/(?:doop-api\\.sap/v2/violations/(.*))": "/$1",
        },
      })
    }
  }, [])

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        meta: {
          endpoint: props.apiEndpoint,
          mock: props.isMock,
        },
      },
    },
  })

  // on load application save the props to be used in oder components
  useLayoutEffect(() => {
    setEndpoint(isMock ? window.location.origin : props?.apiEndpoint)
  }, [props?.apiEndpoint, isMock])

  return (
    <MessagesProvider>
      <AppShell pageHeader={`Doop`} embedded={props.embedded === true}>
        <ContentHeading
          heading={`Decentralized Observer of Policies  ${
            props.displayName ? ` - ${props.displayName}` : ""
          }`}
        />
        <AsyncWorker consumerId={props.id || "doop"} />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppContent
              id={props?.id}
              showDebugSeverities={props.showDebugSeverities}
            />
          </AuthProvider>
        </QueryClientProvider>
      </AppShell>
    </MessagesProvider>
  )
}

const StyledApp = (props) => {
  return (
    <AppShellProvider>
      {/* load styles inside the shadow dom */}
      <style>{styles.toString()}</style>
      <StoreProvider>
        <App {...props} />
      </StoreProvider>
    </AppShellProvider>
  )
}

export default StyledApp
