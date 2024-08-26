/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react"
import { Button, Modal } from "@cloudoperators/juno-ui-components"
import {
  useGlobalsApiEndpoint,
  useSilencesActions,
} from "../../hooks/useAppStore"
import { useActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"
import constants from "../../constants"
import { debounce } from "../../helpers"
import { del } from "../../api/client"

const ExpireSilence = (props) => {
  const { addMessage } = useActions()
  const silence = props.silence
  const fingerprint = props.fingerprint ? props.fingerprint : null
  const [confirmationDialog, setConfirmationDialog] = useState(false)
  const apiEndpoint = useGlobalsApiEndpoint()
  const { addLocalItem } = useSilencesActions()

  const onExpire = debounce(() => {
    // submit silence
    del(`${apiEndpoint}/silence/${silence.id}`)
      .then(() => {
        addMessage({
          variant: "success",
          text: `Silence ${silence.id} expired successfully. Please note that it may take up to 5 minutes for the silence to show up as expired.`,
        })
      })
      .catch((error) => {
        addMessage({
          variant: "error",
          text: `${parseError(error)}`,
        })
      })

    setConfirmationDialog(false)
    // set local silence to override old with expiring and refetch silences

    let newSilence = {
      ...silence,
      status: { ...silence.status, state: constants.SILENCE_EXPIRING },
    }
    addLocalItem({
      silence: newSilence,
      id: newSilence.id,
      type: constants.SILENCE_EXPIRING,
      alertFingerprint: fingerprint,
    })

    return
  }, 200)

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
          <p>
            Do you really want to expire the silence <b>{silence.id}</b>?
          </p>
          <p>
            Comment for the silence: <b>{silence?.comment}</b>
          </p>
        </Modal>
      )}
    </>
  )
}
export default ExpireSilence
