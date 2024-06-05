/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Stack, Button } from "juno-ui-components"
import Avatar from "./Avatar"

const HeaderUser = ({ auth, logout }) => {
  return (
    <Stack alignment="center" className="ml-auto" distribution="end">
      <div className="mr-4">
        <Avatar
          userName={auth?.parsed?.fullName}
          url={auth?.parsed?.avatarUrl?.small}
        />
      </div>

      <Button
        label="Logout"
        size="small"
        onClick={() => logout({ resetOIDCSession: false, silent: true })}
      />
    </Stack>
  )
}

export default HeaderUser
