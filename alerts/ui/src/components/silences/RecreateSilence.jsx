import React, { useState, useMemo } from "react"
import {
  Button,
  FormSection,
  Modal,
  Form,
  FormRow,
  Pill,
  Stack,
  DateTimePicker,
} from "juno-ui-components"
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

  const defaultDate = useMemo(() => {
    const date = new Date()
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }, [])

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
          <Form>
            <FormSection>
              <FormRow>
                <p>{silence.comment}</p>
              </FormRow>
              <FormRow>
                <div className="grid gap-2 grid-cols-2">
                  <DateTimePicker
                    value={silence?.startsAt || defaultDate}
                    dateFormat="Y-m-d H:i:S"
                    label="Select a start date"
                    enableTime
                    time_24hr
                    required
                    errortext={silence}
                    onChange={() => {}}
                    enableSeconds
                  />
                  <DateTimePicker
                    value={silence?.endsAt || defaultDate}
                    dateFormat="Y-m-d H:i:S"
                    label="Select a end date"
                    enableTime
                    time_24hr
                    required
                    errortext={silence}
                    onChange={() => {}}
                    enableSeconds
                  />
                </div>
              </FormRow>

              <FormRow>
                <Stack gap="2" wrap={true}>
                  {Object.keys(silence.matchers).map((label, index) => (
                    <Pill
                      key={index}
                      pillKey={silence?.matchers?.[label].name}
                      pillKeyLabel={silence?.matchers?.[label].name}
                      pillValue={silence?.matchers?.[label].value}
                      pillValueLabel={silence?.matchers?.[label].value}
                    />
                  ))}
                </Stack>
              </FormRow>
            </FormSection>
          </Form>
        </Modal>
      )}
    </>
  )
}
export default ExpireSilence
