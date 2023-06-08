import React from "react"
import { Panel } from "juno-ui-components"
import { useShowDetailsFor, useGlobalsActions } from "../../hooks/useStore"

const AlertDetail = () => {
  const alertID = useShowDetailsFor()
  const { setShowDetailsFor } = useGlobalsActions()

  const onPanelClose = () => {
    setShowDetailsFor(null)
  }

  return (
    <Panel
      heading={
        <span>
          Details for <i>{alertID}</i>
        </span>
      }
      opened={!!alertID}
      onClose={onPanelClose}
    ></Panel>
  )
}

export default AlertDetail
