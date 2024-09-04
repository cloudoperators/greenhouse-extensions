/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect } from "react"
import styles from "./styles.scss"
import {
  AppShell,
  AppShellProvider,
  CodeBlock,
} from "@cloudoperators/juno-ui-components"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import AsyncWorker from "./components/AsyncWorker"
import TabContext from "./components/tabs/TabContext"
import { ErrorBoundary } from "react-error-boundary"
import { useGlobalsActions, StoreProvider } from "./hooks/useAppStore"
import PanelManager from "./components/shared/PanelManager"

function App(props = {}) {
  const { setEmbedded, setApiEndpoint } = useGlobalsActions()
  const preErrorClasses = `
  custom-error-pre
  border-theme-error
  border
  h-full
  w-full
  `

  useLayoutEffect(() => {
    setApiEndpoint(props.endpoint)
    if (props.embedded === "true" || props.embedded === true) setEmbedded(true)
  }, [])

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
      <AppShell
        pageHeader="Converged Cloud | Heureka"
        embedded={props.embedded === "true" || props.embedded === true}
      >
        <ErrorBoundary fallbackRender={fallbackRender}>
          <AsyncWorker consumerId={props.id} />
          <PanelManager />
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
