import React, { useMemo } from "react"
import { AppShell, PageHeader } from "juno-ui-components"
import {
  useAuthData,
  useAuthLoggedIn,
  useGlobalsEmbedded,
  useAuthActions,
} from "../hooks/useAppStore"
import HeaderUser from "./HeaderUser"

const CustomAppShell = ({ children }) => {
  const embedded = useGlobalsEmbedded()
  const authData = useAuthData()
  const loggedIn = useAuthLoggedIn()
  const { logout } = useAuthActions()

  const pageHeader = useMemo(() => {
    return (
      <PageHeader heading="Converged Cloud | Supernova">
        {loggedIn && <HeaderUser auth={authData} logout={logout} />}
      </PageHeader>
    )
  }, [loggedIn, authData, logout])

  return (
    <AppShell
      pageHeader={pageHeader}
      embedded={embedded}
    >
      {children}
    </AppShell>
  )
}

export default CustomAppShell
