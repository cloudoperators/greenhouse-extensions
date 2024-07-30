/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react"
import styles from "./styles.scss"
import {
  AppShell,
  AppShellProvider,
  CodeBlock,
} from "@cloudoperators/juno-ui-components"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import AsyncWorker from "./components/AsyncWorker"
import StoreProvider, { useActions } from "./components/StoreProvider"
import TabContext from "./components/tabs/TabContext"
import { ErrorBoundary } from "react-error-boundary"

const App = (props) => {
  const preErrorClasses = `
  custom-error-pre
  border-theme-error
  border
  h-full
  w-full
  `

  const fallbackRender = ({ error }) => {
    return (
      <div className="w-1/2">
        <CodeBlock className={preErrorClasses} copy={false}>
          {error?.message || error?.toString() || "An error occurred"}
        </CodeBlock>
      </div>
    )
  }

  // Create a client
  const queryClient = new QueryClient({
    defaultOptions: {
      // global default options that apply to all queries
      queries: {
        // staleTime: Infinity, // if you wish to keep data from the keys until reload
        keepPreviousData: true, // nice when paginating
        refetchOnWindowFocus: false, // default: true
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AsyncWorker consumerId={props.id} />
      <AppShell
        pageHeader="Converged Cloud | Heureka"
        embedded={props.embedded === "true" || props.embedded === true}
      >
        <ErrorBoundary fallbackRender={fallbackRender}>
          <TabContext />
        </ErrorBoundary>
      </AppShell>
    </QueryClientProvider>
  )
}

const StyledApp = (props) => {
  return (
    <AppShellProvider theme={`${props.theme ? props.theme : "theme-dark"}`}>
      {/* load styles inside the shadow dom */}
      <style>{styles.toString()}</style>
      <MessagesProvider>
        <StoreProvider options={props}>
          <App {...props} />
        </StoreProvider>
      </MessagesProvider>
    </AppShellProvider>
  )
}

export default StyledApp
