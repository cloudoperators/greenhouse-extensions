/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react"
import useStore from "../hooks/useStore"
import { PageHeader } from "juno-ui-components"
import HeaderUser from "./HeaderUser"

const CustomPageHeader = () => {
  const auth = useStore((state) => state.auth)
  const logout = useStore((state) => state.logout)
  const loggedIn = useStore((state) => state.loggedIn)
  return (
    <PageHeader heading="Converged Cloud | Heureka">
      {loggedIn && <HeaderUser auth={auth} logout={logout} />}
    </PageHeader>
  )
}

export default CustomPageHeader
