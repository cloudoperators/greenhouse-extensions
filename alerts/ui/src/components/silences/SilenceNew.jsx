/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect, useMemo, useState } from "react"
import {
  Modal,
  Button,
  Box,
  Form,
  Textarea,
  TextInput,
  Select,
  SelectOption,
  Message,
  FormRow,
} from "juno-ui-components"
import {
  useAuthData,
  useSilencesExcludedLabels,
  useGlobalsApiEndpoint,
  useSilencesActions,
  useAlertEnrichedLabels,
} from "../../hooks/useAppStore"
import { post } from "../../api/client"
import AlertDescription from "../alerts/shared/AlertDescription"
import SilenceNewAdvanced from "./SilenceNewAdvanced"
import { DateTime } from "luxon"
import {
  latestExpirationDate,
  DEFAULT_DURATION_OPTIONS,
  getSelectOptions,
  setupMatchers,
} from "./silenceHelpers"
import { parseError } from "../../helpers"

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

const SilenceNew = ({ alert, size, variant }) => {
  const authData = useAuthData()
  const apiEndpoint = useGlobalsApiEndpoint()
  const excludedLabels = useSilencesExcludedLabels()
  const { addLocalItem, getMappingSilences } = useSilencesActions()
  const enrichedLabels = useAlertEnrichedLabels()

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
      matchers: setupMatchers(alert?.labels, excludedLabels, enrichedLabels),
    })
    // get the latest expiration date from the existing silences
    // recalculate always on open modal due to the fact that the silences or local silences
    // may change without change in the alert
    setExpirationDate(latestExpirationDate(getMappingSilences(alert)))
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

  const onSubmitForm = () => {
    setError(null)
    setSuccess(null)
    const formValidation = validateForm(formState)
    setShowValidation(formValidation)
    if (Object.keys(formValidation).length > 0) return
    let newFormState = { ...formState }
    // clean up attributes in matchers and remove excluded
    if (newFormState.matchers?.length > 0) {
      newFormState.matchers = newFormState.matchers
        .filter((m) => !m.excluded)
        .map(({ excluded, configurable, ...keepAttrs }) => keepAttrs)
    }
    // add extra attributes
    const startsAt = new Date()
    const endsAt = new Date()
    endsAt.setHours(
      endsAt.getHours() + Number.parseInt(newFormState.duration || 4)
    )

    const newSilence = {
      ...newFormState,
      status: { state: "processing" },
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
            alertFingerprint: alert.fingerprint,
          })
        }
      })
      .catch((error) => {
        setError(parseError(error))
      })
  }

  const onInputChanged = ({ key, value }) => {
    if (!value) return
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
        size={size}
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          setDisplayNewSilence(!displayNewSilence)
        }}
      >
        Silence
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
              There is already a silence for this alert that expires at{" "}
              <b>
                {DateTime.fromISO(expirationDate).toLocaleString(
                  DateTime.DATETIME_SHORT
                )}
              </b>
            </Message>
          )}

          <span className="text-lg font-bold">{alert?.labels?.alertname}</span>

          <Box className="mt-2">
            <AlertDescription description={alert.annotations?.description} />
          </Box>

          {!success && (
            <>
              <SilenceNewAdvanced
                matchers={formState.matchers}
                onMatchersChanged={onMatchersChanged}
              />

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

export default SilenceNew
