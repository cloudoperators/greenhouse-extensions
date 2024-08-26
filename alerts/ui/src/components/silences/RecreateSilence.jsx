/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect, useMemo, useState } from "react"
import {
  Modal,
  Button,
  Form,
  Textarea,
  TextInput,
  Select,
  SelectOption,
  Message,
  FormRow,
  Pill,
  Stack,
} from "@cloudoperators/juno-ui-components"
import {
  useAuthData,
  useGlobalsApiEndpoint,
  useSilencesActions,
} from "../../hooks/useAppStore"
import { debounce } from "../../helpers"
import { post } from "../../api/client"
import { DateTime } from "luxon"
import { latestExpirationDate, getSelectOptions } from "./silenceHelpers"
import { parseError } from "../../helpers"
import constants from "../../constants"

const validateForm = (values) => {
  const invalidItems = {}
  if (values?.comment?.length <= 3) {
    if (!invalidItems["comment"]) invalidItems["comment"] = []
    invalidItems["comment"].push(`Please enter at least 3 characters`)
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

const RecreateSilence = (props) => {
  const silence = props.silence
  const fingerprint = props.fingerprint ? props.fingerprint : null
  const authData = useAuthData()
  const apiEndpoint = useGlobalsApiEndpoint()

  const { addLocalItem, getMappingSilences } = useSilencesActions()

  const [displayNewSilence, setDisplayNewSilence] = useState(false)
  const [formState, setFormState] = useState(DEFAULT_FORM_VALUES)
  const [expirationDate, setExpirationDate] = useState(null)
  const [showValidation, setShowValidation] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Initialize form state on modal open
  // Removed alert from dependencies since we take an screenshot of the global state on opening the modal
  // This is due to if the alert changes (e.g. the alert receives a new silenceBy) while the modal is open, the form state will be reset
  useLayoutEffect(() => {
    if (!displayNewSilence) return

    // reset form state with default values
    setFormState({
      ...formState,
      ...DEFAULT_FORM_VALUES,
      createdBy: authData?.parsed?.fullName,
      matchers: silence.matchers,
      comment: silence.comment,
    })
    // get the latest expiration date from the existing silences
    // recalculate always on open modal due to the fact that the silences or local silences
    // may change without change in the alert
    setExpirationDate(latestExpirationDate())
    // reset other states
    setError(null)
    setSuccess(null)
    setShowValidation({})
  }, [displayNewSilence])

  // collect options for select dropdown with time (2 hours, 12 hours, 1 day, 3 days, 7 days) which exceeds the expiration date
  // on open panel retrigger the calculation
  const durationOptions = useMemo(() => {
    const options = getSelectOptions(expirationDate)
    if (options.firstNotCovered) {
      // reset the first option which is not covered by the existing silence
      setFormState({ ...formState, duration: options.firstNotCovered.value })
    }
    return options.items
  }, [expirationDate])

  // debounce to prevent accidental double clicks from creating multiple silences
  const onSubmitForm = debounce(() => {
    setError(null)
    setSuccess(null)
    const formValidation = validateForm(formState)
    setShowValidation(formValidation)
    if (Object.keys(formValidation).length > 0) return
    let newFormState = { ...formState }

    // add extra attributes
    const startsAt = new Date()
    const endsAt = new Date()
    endsAt.setHours(
      endsAt.getHours() + Number.parseInt(newFormState.duration || 4)
    )

    const newSilence = {
      ...newFormState,
      status: { state: constants.SILENCE_CREATING },
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    }

    // submit silence
    post(`${apiEndpoint}/silences`, {
      body: JSON.stringify(newSilence),
    })
      .then((data) => {
        setSuccess(data)
        if (data?.silenceID) {
          // add silence to local store
          addLocalItem({
            silence: newSilence,
            id: data.silenceID,
            type: constants.SILENCE_CREATING,
            alertFingerprint: fingerprint,
          })
        }
      })
      .catch((error) => {
        setError(parseError(error))
      })
  }, 200)

  const onInputChanged = ({ key, value }) => {
    if (!value) return
    setFormState({ ...formState, [key]: value })
  }

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation()
          setDisplayNewSilence(!displayNewSilence)
        }}
      >
        Recreate
      </Button>
      {displayNewSilence && (
        <Modal
          title="New Silence for"
          size="large"
          open={true}
          confirmButtonLabel={success ? null : "Save"}
          onCancel={() => setDisplayNewSilence(false)}
          onConfirm={success ? null : onSubmitForm}
        >
          {error && <Message text={error} variant="danger" />}

          {success && (
            <Message className="mb-6" variant="success">
              A silence object with id <b>{success?.silenceID}</b> was created
              successfully. Please note that it may take up to 5 minutes for the
              alert to show up as silenced.
            </Message>
          )}

          {expirationDate && !success && (
            <Message className="mb-6" variant="info">
              There is already a silence for this alert that expires at
              <b>
                {DateTime.fromISO(expirationDate).toLocaleString(
                  DateTime.DATETIME_SHORT
                )}
              </b>
            </Message>
          )}

          {!success && (
            <>
              <div className="advanced-area overflow-hidden">
                <p className="mt-2">Matchers attached to this silence</p>

                <Stack gap="2" alignment="start" wrap={true} className="mt-2">
                  {formState?.matchers &&
                    Object.keys(formState?.matchers).map((label, index) => (
                      <Pill
                        key={index}
                        pillKey={silence?.matchers[label]?.name}
                        pillKeyLabel={silence?.matchers[label]?.name}
                        pillValue={silence?.matchers[label]?.value}
                        pillValueLabel={silence?.matchers[label]?.value}
                      />
                    ))}
                </Stack>
              </div>

              <Form className="mt-6">
                <FormRow>
                  <TextInput
                    required
                    label="Silenced by"
                    value={formState.createdBy}
                    disabled
                  />
                </FormRow>
                <FormRow>
                  <Textarea
                    className="h-20"
                    label="Description"
                    value={formState.comment}
                    onChange={(e) =>
                      onInputChanged({ key: "comment", value: e.target.value })
                    }
                    errortext={
                      showValidation["comment"] &&
                      errorHelpText(showValidation["comment"])
                    }
                    required
                  />
                </FormRow>
                <FormRow>
                  <Select
                    required
                    label="Duration"
                    value={formState.duration}
                    onChange={(value) =>
                      onInputChanged({
                        key: "duration",
                        value,
                      })
                    }
                  >
                    {durationOptions?.map((option) => (
                      <SelectOption
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Select>
                </FormRow>
              </Form>
            </>
          )}
        </Modal>
      )}
    </>
  )
}

export default RecreateSilence
