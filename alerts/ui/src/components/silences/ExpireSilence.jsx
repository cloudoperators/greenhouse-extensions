import React, { useState } from "react"
import { Button, Modal } from "juno-ui-components"

const ExpireSilence = () => {
  const [confirmationDialog, setConfirmationDialog] = useState(false)
  const onExpire = () => {
    setConfirmationDialog(false)
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
