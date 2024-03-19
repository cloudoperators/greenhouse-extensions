/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { AppShellProvider } from "juno-ui-components"
import AppContent from "./components/AppContent"
import styles from "./styles.scss"
import AuthProvider from "./components/AuthProvider"
import { MessagesProvider } from "messages-provider"
import StoreProvider from "./components/StoreProvider"
import AsyncWorker from "./components/AsyncWorker"
import { AppShell } from "juno-ui-components"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"

const App = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        meta: {
          endpoint: props.apiEndpoint,
          mock: props.mock,
        },
      },
    },
  })

  return (
    <MessagesProvider>
      <AppShell
        pageHeader={`Doop`}
        contentHeading={`Decentralized Observer of Policies  ${
          props.displayName ? ` - ${props.displayName}` : ""
        }`}
        embedded={props.embedded === true}
      >
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
