import React, { useState } from "react"
import { Button, Modal } from "juno-ui-components"
import {
  useGlobalsApiEndpoint,
  useSilencesActions,
} from "../../hooks/useAppStore"
import { useActions } from "messages-provider"
import { parseError } from "../../helpers"

import { del } from "../../api/client"

const ExpireSilence = (props) => {
  const { addMessage } = useActions()
  const silenceId = props.silenceId
  const [confirmationDialog, setConfirmationDialog] = useState(false)
  const apiEndpoint = useGlobalsApiEndpoint()

  const onCreateSilence = () => {
    setConfirmationDialog(false)
    return
  }

  return (
    <>
      <Button onClick={() => setConfirmationDialog(true)}>Recreate</Button>
      {confirmationDialog && (
        <Modal
          cancelButtonLabel="Cancel"
          confirmButtonLabel="Create Silence"
          onCancel={() => setConfirmationDialog(false)}
          onConfirm={onCreateSilence}
          open={true}
          title="Confirmation needed"
        >
          <p>Do you really want to create the silence?</p>
        </Modal>
      )}
    </>
  )
}
export default ExpireSilence
