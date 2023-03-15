import React, { useMemo } from "react"

import { AppShell } from "juno-ui-components"
import AppContent from "./AppContent"
import styles from "./styles.inline.scss"
import StyleProvider from "juno-ui-components"
import useAlertmanagerAPI from "./hooks/useAlertmanagerAPI"
import useStore from "./hooks/useStore"
import useCommunication from "./hooks/useCommunication"

const App = (props = {}) => {
  const embedded = useMemo(
    () => props.embedded === "true" || props.embedded === true,
    [props.embedded]
  )

  useCommunication()
  useAlertmanagerAPI(props.endpoint)

  return (
    <AppShell
      pageHeader="Converged Cloud | Supernova"
      contentHeading="Supernova"
      embedded={embedded}
    >
      <AppContent props={props} />
    </AppShell>
  )
}

const StyledApp = (props) => {
  return (
    <StyleProvider
      stylesWrapper="shadowRoot"
      theme={`${props.theme ? props.theme : "theme-dark"}`}
    >
      {/* load styles inside the shadow dom */}
      <style>{styles.toString()}</style>
      <App {...props} />
    </StyleProvider>
  )
}

export default StyledApp
