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

const setupMatchers = (alertLabels, excludedLabels, filterLabels) => {
  if (!alertLabels || !excludedLabels || !filterLabels) return
  let items = []
  // allow just labels which are configured
  filterLabels.forEach((filterLabel) => {
    const value = alertLabels?.[filterLabel]
    if (value) {
      const matcher = {
        name: filterLabel,
        value: value,
        isRegex: false, // for now hardcode isRegex to false since we take the exact value
        excluded: false,
        configurable: false,
      }
      // copy excluded label values to a different array
      if (excludedLabels[filterLabel]) {
        items.push({ ...matcher, excluded: true, configurable: true })
      } else {
        items.push(matcher)
      }
    }
  })
  return items
}

const DEFAULT_FORM_VALUES = { duration: "2", comment: "" }

const SilenceNew = ({ alert }) => {
  const authData = useAuthData()
  const excludedLabelsHash = useSilencesExcludedLabelsHash()
  const filterLabels = useFilterLabels()
  const [displayNewSilence, setDisplayNewSilence] = useState(false)
  const [formState, setFormState] = useState(DEFAULT_FORM_VALUES)
  const [showValidation, setShowValidation] = useState({})

  // initialize form state with default values
  useEffect(() => {
    if (
      !alert?.labels ||
      !excludedLabelsHash ||
      !filterLabels ||
      !authData ||
      !displayNewSilence // do nothing on close modal but reset form state on open always
    )
      return

    const matchers = setupMatchers(
      alert?.labels,
      excludedLabelsHash,
      filterLabels
    )
    setFormState({
      ...formState,
      createdBy: authData?.parsed?.fullName,
      matchers: matchers,
    })
  }, [alert, excludedLabelsHash, filterLabels, authData, displayNewSilence])

  const onCloseModal = () => {
    // reset state
    setDisplayNewSilence(false)
    setFormState(DEFAULT_FORM_VALUES)
  }

  const onSubmitForm = () => {
    const formValidation = validateForm(formState)
    setShowValidation(formValidation)
    if (Object.keys(formValidation).length > 0) return
    // clean up attributes in matchers
    let matchers = formState.matchers.slice()
  }

  const onInputChanged = ({ key, value }) => {
    setFormState({ ...formState, [key]: value })
  }

  const onMatchersChanged = (matcher) => {
    const index = formState.matchers.findIndex(
      (item) => item.name == matcher.name
    )
    let items = formState.matchers.slice()
    // update item
    if (index >= 0) {
      items[index] = { ...items[index], excluded: !matcher.excluded }
    }
    setFormState({ ...formState, matchers: items })
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
            matchers={formState.matchers}
            onMatchersChanged={onMatchersChanged}
          />

          <Form className="mt-6">
            <TextInputRow
              required
              label="Silenced by"
              value={formState.createdBy}
              disabled
            />
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
