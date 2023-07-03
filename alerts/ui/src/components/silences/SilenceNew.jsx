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
  Message,
} from "juno-ui-components"
import {
  useAuthData,
  useSilencesExcludedLabelsHash,
  useFilterLabels,
  useGlobalsApiEndpoint,
  useSilencesActions,
  useSilencesLocalItems,
} from "../../hooks/useStore"
import { post } from "../../api/client"
import AlertDescription from "../alerts/shared/AlertDescription"
import SilenceNewAdvanced from "./SilenceNewAdvanced"
import { DateTime } from "luxon"

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

const DEFAULT_DURATION_OPTIONS = [
  { label: "2 hours", value: "2" },
  { label: "12 hours", value: "12" },
  { label: "1 day", value: "24" },
  { label: "3 days", value: "72" },
  { label: "7 days", value: "168" },
]

const DEFAULT_FORM_VALUES = { duration: "2", comment: "" }

const SilenceNew = ({ alert }) => {
  const authData = useAuthData()
  const apiEndpoint = useGlobalsApiEndpoint()
  const excludedLabelsHash = useSilencesExcludedLabelsHash()
  const filterLabels = useFilterLabels()

  const { addLocalItem, getMappingSilences } = useSilencesActions()
  const localSilences = useSilencesLocalItems() // load local silences

  const [displayNewSilence, setDisplayNewSilence] = useState(false)
  const [formState, setFormState] = useState(DEFAULT_FORM_VALUES)
  const [showValidation, setShowValidation] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // initialize form state with default values
  useEffect(() => {
    if (
      !alert?.labels ||
      !excludedLabelsHash ||
      !filterLabels ||
      !authData ||
      !displayNewSilence // do nothing on close modal but reset form state and matchers on open always
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
  }, [alert, authData, excludedLabelsHash, filterLabels, displayNewSilence])

  // get the "latest" expiration date if there is a silence for the alert
  // Add local silences dependency to be able to update the expiration date when a new silence is created
  const expirationDate = useMemo(() => {
    // on open recalculates the expiration date since it may change depending on the local silences
    if (!alert && !displayNewSilence) return
    const silences = getMappingSilences(alert)
    if (silences?.length > 0) {
      const sortedSilences = silences.sort((a, b) => {
        return new Date(b.endsAt) - new Date(a.endsAt)
      })
      return sortedSilences[0].endsAt
    }
  }, [alert, displayNewSilence])

  // collect options for select dropdown with time (2 hours, 12 hours, 1 day, 3 days, 7 days) which exceeds the expiration date
  // on open panel retrigger the calculation
  const durationOptions = useMemo(() => {
    if (!expirationDate) return DEFAULT_DURATION_OPTIONS
    const now = new Date()
    const expiration = new Date(expirationDate)
    const diff = expiration - now
    const diffInHours = diff / (1000 * 60 * 60)
    const newOptions = DEFAULT_DURATION_OPTIONS.map((o) => {
      if (o.value <= diffInHours) {
        return {
          ...o,
          label: o.label + " (covered with the existing silence)",
          covered: true,
        }
      }
      return o
    })
    // find the first option which is not covered by the existing silence
    const firstNotCovered = newOptions.find((o) => !o?.covered)
    if (firstNotCovered) {
      setFormState({ ...formState, duration: firstNotCovered.value })
    }

    return newOptions
  }, [expirationDate])

  const onCloseModal = () => {
    // reset states
    setDisplayNewSilence(false)
    setFormState(DEFAULT_FORM_VALUES)
    setError(null)
    setSuccess(null)
  }

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
        setError(error.message)
      })
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
          confirmButtonLabel={success ? null : "Save"}
          onCancel={onCloseModal}
          onConfirm={success ? null : onSubmitForm}
        >
          {error && <Message text={error} variant="success" />}

          {success && (
            <Message className="mb-6" variant="info">
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

          <span className="text-lg">
            <b>{alert?.labels?.alertname}</b>
          </span>

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
                  {durationOptions.map((option) => (
                    <SelectOption
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </SelectRow>
              </Form>
            </>
          )}
        </Modal>
      )}
    </>
  )
}

export default SilenceNew
