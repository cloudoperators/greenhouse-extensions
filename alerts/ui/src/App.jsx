import React, { useEffect, useLayoutEffect } from "react"

import { AppShell, AppShellProvider } from "juno-ui-components"
import AppContent from "./AppContent"
import styles from "./styles.scss"
import useAlertmanagerAPI from "./hooks/useAlertmanagerAPI"
import {
  useGlobalsActions,
  useFilterActions,
  useSilencesActions,
} from "./hooks/useStore"
import useCommunication from "./hooks/useCommunication"
import { MessagesProvider } from "messages-provider"
import CustomAppShell from "./components/CustomAppShell"
import usePredefinedFilters from "./hooks/usePredefinedFilters"
import useUrlState from "./hooks/useUrlState"

function App(props = {}) {
  const { setLabels } = useFilterActions()
  const { setEmbedded, setApiEndpoint } = useGlobalsActions()
  const { setExcludedLabels } = useSilencesActions()

  /** TODO:
   * load the values from kubernetes plugin config instead of hardcoding
   * */
  // transfer plugin config to store
  useEffect(() => {
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

    const silenceExcludedLabels = ["status", "pod", "instance"]
    setExcludedLabels(silenceExcludedLabels)

    // save the apiEndpoint. It is also used outside the alertManager hook
    setApiEndpoint(props.endpoint)
  }, [])

  useCommunication()
  useAlertmanagerAPI(props.endpoint)
  useUrlState()
  usePredefinedFilters()

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
