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
import {
  useGlobalsActions,
  useFilterActions,
  StoreProvider,
} from "./hooks/useAppStore"
import PanelManager from "./components/shared/PanelManager"

function App(props = {}) {
  const { setLabels, setPredefinedFilters, setActivePredefinedFilter } =
    useFilterActions()
  const { setEmbedded, setApiEndpoint } = useGlobalsActions()
  const preErrorClasses = `
  custom-error-pre
  border-theme-error
  border
  h-full
  w-full
  `

  useLayoutEffect(() => {
    // filterLabels are the labels shown in the filter dropdown, enabling users to filter services based on specific criteria. Default is support-group.
    if (props.filterLabels) setLabels(props.filterLabels)

    // predefined filters config
    const predefinedFilters = [
      {
        name: "support-group",
        displayName: "support-group",
        // regex that matches all entities with default filter
        region: "\bcontainers\b",
      },
    ]
    // setPredefinedFilters(predefinedFilters)

    // initially active predefined filter
    const initialPredefinedFilter = "support-group"
    // setActivePredefinedFilter(initialPredefinedFilter)

    // save the apiEndpoint. It is also used outside the alertManager hook
    setApiEndpoint(props.endpoint)
  }, [])

  useLayoutEffect(() => {
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
