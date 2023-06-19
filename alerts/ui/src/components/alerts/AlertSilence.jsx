import React, { useEffect, useMemo, useState } from "react"
import {
  Modal,
  Button,
  Box,
  Form,
  TextareaRow,
  TextInputRow,
  SelectRow,
  SelectOption,
  Stack,
  Icon,
  ModalFooter,
  ButtonRow,
} from "juno-ui-components"
import AlertLabels from "./shared/AlertLabels"
import { Markup } from "interweave"
import { descriptionParsed } from "../../lib/utils"
import { useAuthData } from "../../hooks/useStore"
import { post } from "../../api/client"

const detailsCss = (show) => {
  return `      
      transition-all
      ease-out
      max-h-0
      overflow-y-scroll
			${show ? "duration-1000 max-h-[34rem]" : `duration-300`}
		`
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
}

const validateForm = (values) => {
  const invalidItems = {}
  if (values?.comment?.length <= 3) {
    if (!invalidItems["comment"]) invalidItems["comment"] = []
    invalidItems["comment"].push(`Description can't be blank`)
  }

  return invalidItems
}

const errorHelpText = (messages) => {
  return messages.map((msg, i) => (
    <span key={i} className="block text-theme-danger ">
      {msg}
    </span>
  ))
}

const DEFAULT_FORM_VALUES = { duration: "2", comment: "" }

const AlertSilence = ({ alert }) => {
  const [displayNewSilence, setDisplayNewSilence] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [formState, setFormState] = useState(DEFAULT_FORM_VALUES)
  const [showValidation, setShowValidation] = useState({})
  const authData = useAuthData()

  const onCloseModal = () => {
    // reset state
    setDisplayNewSilence(false)
    setShowDetails(false)
    setFormState(DEFAULT_FORM_VALUES)
  }

  const onSubmitForm = () => {
    const formValidation = validateForm(formState)
    setShowValidation(formValidation)
    if (Object.keys(formValidation).length > 0) return
  }

  const onInputChanged = ({ key, value }) => {
    setFormState({ ...formState, [key]: value })
  }

  const name = useMemo(() => {
    return authData?.parsed?.fullName
  }, [authData])

  return (
    <>
      <Button
        size="small"
        onClick={() => setDisplayNewSilence(!displayNewSilence)}
      >
        Silence
      </Button>
      {displayNewSilence && (
        <Modal
          title="New Silence"
          size="large"
          open={true}
          confirmButtonLabel="Save"
          onCancel={onCloseModal}
          onConfirm={onSubmitForm}
        >
          <span className="text-lg">
            Alert <b>{alert?.labels?.alertname}</b>
          </span>

          {/* <Stack className="mb-4" alignment="center" distribution="end"> */}
          <div
            className="cursor-pointer mt-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Stack alignment="center">
              Show details
              <Icon
                color="jn-global-text"
                icon={showDetails ? "expandLess" : "expandMore"}
              />
            </Stack>
          </div>
          {/* </Stack> */}

          <div className="overflow-hidden">
            <div className={detailsCss(showDetails)}>
              <div className="pt-4">
                <AlertLabels alert={alert} />
                <Box className="mt-4">
                  <Markup
                    content={descriptionParsed(
                      alert.annotations?.description?.replace(
                        /`([^`]+)`/g,
                        "<code class='inline-code'>$1</code>"
                      )
                    )}
                    tagName="div"
                    className="text-theme-light"
                  />
                </Box>
              </div>
            </div>
          </div>

          <Form className="mt-8">
            <TextInputRow required label="Silenced by" value={name} disabled />
            <TextareaRow
              label="Description"
              value={formState.comment}
              onChange={(e) =>
                onInputChanged({ key: "comment", value: e.target.value })
              }
              helptext={
                showValidation["comment"] &&
                errorHelpText(showValidation["comment"])
              }
              required
            />
            <SelectRow
              required
              label="Duration"
              defaultValue={formState.duration}
              onValueChange={(e) =>
                onInputChanged({ key: "duration", value: e })
              }
            >
              <SelectOption label="2 hours" value="2" />
              <SelectOption label="12 hours" value="12" />
              <SelectOption label="1 day" value="24" />
              <SelectOption label="3 days" value="72" />
              <SelectOption label="7 days" value="168" />
            </SelectRow>
          </Form>
        </Modal>
      )}
    </>
  )
}

export default AlertSilence
