import React, { useEffect, useLayoutEffect } from "react"

import { AppShellProvider } from "juno-ui-components"
import AppContent from "./AppContent"
import styles from "./styles.scss"
import useAlertmanagerAPI from "./hooks/useAlertmanagerAPI"
import {
  useGlobalsActions,
  useFilterActions,
  useSilencesActions,
  useAlertsActions,
} from "./hooks/useStore"
import useCommunication from "./hooks/useCommunication"
import { MessagesProvider } from "messages-provider"
import CustomAppShell from "./components/CustomAppShell"
import useInitialFilters from "./hooks/useInitialFilters"
import useUrlState from "./hooks/useUrlState"

function App(props = {}) {
  const { setLabels, setPredefinedFilters, setActivePredefinedFilter } =
    useFilterActions()
  const { setEmbedded, setApiEndpoint } = useGlobalsActions()
  const { setExcludedLabels } = useSilencesActions()
  const { setEnrichedLabels } = useAlertsActions()

  /** TODO:
   * load the values from kubernetes plugin config instead of hardcoding
   * */
  // transfer plugin config to store
  useLayoutEffect(() => {
    // load from plugin config
    const filterLabels = [
      "app",
      "cluster",
      "cluster_type",
      "context",
      "job",
      "region",
      "service",
      "severity",
      "status",
      "support_group",
      "tier",
      "type",
    ]
    setLabels(filterLabels)

    const silenceExcludedLabels = ["pod", "instance"]
    setExcludedLabels(silenceExcludedLabels)

    // labels that are enriched by the alert worker
    // this labels should be excluded when creating a silence
    const alertEnrichedLabels = ["status"]
    setEnrichedLabels(alertEnrichedLabels)

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

  useCommunication()
  useAlertmanagerAPI(props.endpoint)
  useUrlState()
  useInitialFilters()

  useLayoutEffect(() => {
    if (props.embedded === "true" || props.embedded === true) setEmbedded(true)
  }, [])

  return (
    <MessagesProvider>
      <CustomAppShell>
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
      <App {...props} />
    </AppShellProvider>
  )
}

export default StyledApp
