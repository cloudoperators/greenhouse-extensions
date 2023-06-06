import React, { useMemo } from "react"
import { Stack, Button } from "juno-ui-components"
import Avatar from "./Avatar"

const HeaderUser = ({ auth, logout }) => {
  const name = useMemo(() => {
    return auth?.parsed?.fullName
  }, [auth])

  return (
    <Stack alignment="center" className="ml-auto" distribution="end">
      <div className="mr-4">
        <Avatar
          userName={name}
          avatarUrl={auth?.parsed?.avatarUrl}
          displayName
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
