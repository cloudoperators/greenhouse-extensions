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
  const silence = props.silence
  const [confirmationDialog, setConfirmationDialog] = useState(false)
  const apiEndpoint = useGlobalsApiEndpoint()

  const { setShowDetailsForSilence } = useSilencesActions()
  const onExpire = () => {
    // submit silence
    del(`${apiEndpoint}/silence/${silence.id}`)
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
    setShowDetailsForSilence(false)
    return
  }

  return (
    <>
      <Button
        variant="primary-danger"
        onClick={() => setConfirmationDialog(true)}
      >
        Expire
      </Button>
      {confirmationDialog && (
        <Modal
          cancelButtonLabel="Cancel"
          confirmButtonLabel="Proceed irreversible deletion"
          onCancel={() => setConfirmationDialog(false)}
          onConfirm={onExpire}
          open={true}
          title="Confirmation needed"
        >
          <p>Proceeding will result in the permanent loss of the plugin.</p>
        </Modal>
      )}
    </>
  )
}
export default ExpireSilence
