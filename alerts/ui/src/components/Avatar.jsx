import React from "react"
import { Stack } from "juno-ui-components"

const avatarCss = `
h-8
w-8
bg-theme-background-lvl-2
rounded-full
mr-2
bg-cover 
`

const Avatar = ({ userName, displayName, avatarUrl }) => {
  return (
    <Stack alignment="center">
      <div
        style={{
          background: `url(${avatarUrl?.small}) no-repeat`,
          backgroundSize: `cover`,
        }}
        className={avatarCss}
      />
      {displayName && <span>{userName}</span>}
    </Stack>
  )
}

export default Avatar
