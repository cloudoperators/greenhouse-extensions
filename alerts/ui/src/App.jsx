/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect } from "react"

import { AppShellProvider } from "juno-ui-components"
import AppContent from "./AppContent"
import styles from "./styles.scss"
import {
  useGlobalsActions,
  useFilterActions,
  useSilencesActions,
  useAlertsActions,
  StoreProvider,
} from "./hooks/useAppStore"
import AsyncWorker from "./components/AsyncWorker"
import { MessagesProvider } from "messages-provider"
import CustomAppShell from "./components/CustomAppShell"

function App(props = {}) {
  const { setLabels, setPredefinedFilters, setActivePredefinedFilter } =
    useFilterActions()
  const { setEmbedded, setApiEndpoint } = useGlobalsActions()
  const { setExcludedLabels } = useSilencesActions()
  const { setEnrichedLabels } = useAlertsActions()

  useLayoutEffect(() => {
    // filterLabels are the labels shown in the filter dropdown, enabling users to filter alerts based on specific criteria. Default is status.
    if (props.filterLabels) setLabels(props.filterLabels)

    // silenceExcludedLabels are labels that are initially excluded by default when creating a silence. However, they can be added if necessary when utilizing the advanced options in the silence form.
    if (props.silenceExcludedLabels)
      setExcludedLabels(props.silenceExcludedLabels)

    // predefined filters config
    const predefinedFilters = [
      {
        name: "prod",
        displayName: "Prod",
        matchers: {
          // regex that matches anything except regions that start with qa-de-
          region: "^(?!qa-de-).*",
        },
      },
      {
        name: "prod-qa",
        displayName: "Prod + QA",
        matchers: {
          // regex that matches anything except regions that start with qa-de- and end with a number that is not 1
          // regex is used in RegExp constructor, so we need to escape the backslashes for flags
          region: "^(?!qa-de-(?!1$)\\d+).*",
        },
      },
      {
        name: "labs",
        displayName: "Labs",
        matchers: {
          // regex that matches all regions that start with qa-de- and end with a number that is not 1
          // regex is used in RegExp constructor, so we need to escape the backslashes for flags
          region: "^qa-de-(?!1$)\\d+",
        },
      },
      {
        name: "all",
        displayName: "All",
        matchers: {
          region: ".*",
        },
      },
    ]
    setPredefinedFilters(predefinedFilters)

    // initially active predefined filter
    const initialPredefinedFilter = "prod"
    setActivePredefinedFilter(initialPredefinedFilter)

    // save the apiEndpoint. It is also used outside the alertManager hook
    setApiEndpoint(props.endpoint)
  }, [])

  useLayoutEffect(() => {
    if (props.embedded === "true" || props.embedded === true) setEmbedded(true)
  }, [])

  return (
    <MessagesProvider>
      <CustomAppShell>
        <AsyncWorker endpoint={props.endpoint} />
        <AppContent props={props} />
      </CustomAppShell>
    </MessagesProvider>
  )
}

const StyledApp = (props) => {
  return (
    <AppShellProvider theme={`${props.theme ? props.theme : "theme-dark"}`}>
      {/* load appstyles inside the shadow dom */}
      <style>{styles.toString()}</style>
      <StoreProvider>
        <App {...props} />
      </StoreProvider>
    </AppShellProvider>
  )
}

export default StyledApp
