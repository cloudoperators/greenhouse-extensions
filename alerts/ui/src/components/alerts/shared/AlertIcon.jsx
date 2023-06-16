import React, { forwardRef } from "react"

import { Icon } from "juno-ui-components"


const AlertIcon = ({severity}, ref) => {

  const iconColor = () => {

    switch (severity) {
      case "critical":
        return "text-theme-danger"
      case "warning":
        return "text-theme-warning"
      case "info":
        return "text-theme-info"
    }

  }

  return (
    <>
      {severity === "critical" ? (
        <Icon ref={ref} icon="danger" color={iconColor()} />
      ) : severity?.match(/^(warning|info)$/) ? (
        <Icon
          icon={severity}
          color={iconColor()}
          ref={ref}
        />
      ) : (
        <Icon ref={ref} icon="errorOutline" />
      )}
    </>
  )
}

export default forwardRef(AlertIcon)