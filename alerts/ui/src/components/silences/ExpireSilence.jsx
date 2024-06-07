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

  const onExpire = () => {
    // submit silence
    del(`${apiEndpoint}/silence/${silenceId}`)
      .then(() => {
        addMessage({
          variant: "success",
          text: `Silence expired successfully.`,
        })
      })
      .catch((error) => {
        console.log("error", error)
        addMessage({
          variant: "error",
          text: `${parseError(error)}`,
        })
      })

    setConfirmationDialog(false)
    return
  }

  return (
    <>
      <Button onClick={() => setConfirmationDialog(true)}>Expire</Button>
      {confirmationDialog && (
        <Modal
          cancelButtonLabel="Cancel"
          confirmButtonLabel="Expire Silence"
          onCancel={() => setConfirmationDialog(false)}
          onConfirm={onExpire}
          open={true}
          title="Confirmation needed"
        >
          <p>Do you really want to expire the silence?</p>
        </Modal>
      )}
    </>
  )
}
export default ExpireSilence
