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
} from "juno-ui-components"
import {
  useAuthData,
  useSilencesExcludedLabelsHash,
  useFilterLabels,
} from "../../hooks/useStore"
import { post } from "../../api/client"
import AlertDescription from "../alerts/shared/AlertDescription"
import SilenceNewAdvanced from "./SilenceNewAdvanced"

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

const SilenceNew = ({ alert }) => {
  const authData = useAuthData()
  const excludedLabelsHash = useSilencesExcludedLabelsHash()
  const filterLabels = useFilterLabels()
  const [displayNewSilence, setDisplayNewSilence] = useState(false)
  const [formState, setFormState] = useState(DEFAULT_FORM_VALUES)
  const [showValidation, setShowValidation] = useState({})
  const [matchers, setMatchers] = useState([])

  const name = useMemo(() => {
    return authData?.parsed?.fullName
  }, [authData])

  // init the matchers
  // use displayNewSilence to reset the matchers on open and close the same alert
  useEffect(() => {
    if (!alert?.labels || !excludedLabelsHash || !filterLabels) return

    let items = []
    // allow just labels which are configured
    filterLabels.forEach((filterLabel) => {
      const value = alert?.labels?.[filterLabel]
      if (value) {
        const matcher = {
          key: filterLabel,
          value: value,
          excluded: false,
          configurable: false,
        }
        // copy excluded label values to a different array
        if (excludedLabelsHash[filterLabel]) {
          items.push({ ...matcher, excluded: true, configurable: true })
        } else {
          items.push(matcher)
        }
      }
    })
    setMatchers(items)
  }, [alert, excludedLabelsHash, filterLabels, displayNewSilence])

  const onCloseModal = () => {
    // reset state
    setDisplayNewSilence(false)
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

  const onMatchersChanged = (matcher) => {
    const index = matchers.findIndex((item) => item.key == matcher.key)
    let items = matchers.slice()
    // update item
    if (index >= 0) {
      items[index] = {
        key: matcher.key,
        value: matcher.value,
        excluded: !matcher.excluded,
        configurable: matcher.configurable,
      }
    }
    setMatchers(items)
  }

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
          title="New Silence for"
          size="large"
          open={true}
          confirmButtonLabel="Save"
          onCancel={onCloseModal}
          onConfirm={onSubmitForm}
        >
          <span className="text-lg">
            <b>{alert?.labels?.alertname}</b>
          </span>

          <Box className="mt-2">
            <AlertDescription description={alert.annotations?.description} />
          </Box>

          <SilenceNewAdvanced
            matchers={matchers}
            onMatchersChanged={onMatchersChanged}
          />

          <Form className="mt-6">
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

export default SilenceNew
