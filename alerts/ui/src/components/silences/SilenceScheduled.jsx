import React, { useEffect, useState, useMemo } from "react"
import produce from "immer"

import { Messages, useActions } from "messages-provider"
import {
  Modal,
  Box,
  Form,
  Textarea,
  TextInput,
  Select,
  SelectOption,
  Message,
  FormRow,
  Stack,
  Pill,
  FormSection,
  DateTimePicker,
} from "juno-ui-components"
import {
  useAuthData,
  useSilenceTemplates,
  useGlobalsApiEndpoint,
} from "../../hooks/useAppStore"
import { post, get } from "../../api/client"
import { parseError } from "../../helpers"

import { DEFAULT_FORM_VALUES, validateForm } from "./silenceScheduledHelpers"

const SilenceScheduled = (props) => {
  const authData = useAuthData()
  const { addMessage, resetMessages } = useActions()
  const silenceTemplates = useSilenceTemplates()
  const apiEndpoint = useGlobalsApiEndpoint()

  // set sucess of sending the silence
  const [success, setSuccess] = useState(null)

  // set the selected template
  const [selected, setSelected] = useState(null)

  // default time for DateTimePicker

  const defaultDate = useMemo(() => {
    const date = new Date()
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }, [])

  // Formular which will be used to create the silence
  const [formState, setFormState] = useState(DEFAULT_FORM_VALUES)

  // useEffect to init callback after rendering. This is needed to reopen the SilencedScheduledWrapper closing the modal
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (closed) {
      props.callbackOnClose()
    }
  }, [closed])

  // submit
  const onSubmitForm = () => {
    // reset errors.
    resetMessages()

    setSuccess(null)

    // validate form and sets in case of errors messages and stops the submit
    let errorFormState = validateForm(formState)

    if (errorFormState) {
      setFormState(errorFormState)
      addMessage({
        variant: "error",
        text: parseError("Please fix the errors in the form"),
      })
      return
    }

    const silence = {
      startsAt: formState.date.start,
      endsAt: formState.date.end,
      comment: formState.comment.value,
      createdBy: formState.createdBy,
      matchers: [],
    }

    for (const [key, value] of Object.entries(formState.editable_labels)) {
      silence.matchers.push({
        name: key,
        value: value.value,
        isRegex: true,
      })
    }

    for (const [key, value] of Object.entries(formState.fixed_labels)) {
      silence.matchers.push({
        name: key,
        value: value,
        isRegex: true,
      })
    }

    // submit silence
    post(`${apiEndpoint}/silences`, {
      body: JSON.stringify(silence),
    })
      .then((data) => {
        setSuccess(data)
      })
      .catch((error) => {
        addMessage({
          variant: "error",
          text: parseError(error),
        })
      })
  }

  //////
  ////// OnClick

  const onChangeTemplate = (value) => {
    const newSelectedOption = silenceTemplates.find(
      (option) => option.id === value
    )

    const newFormState = {
      ...DEFAULT_FORM_VALUES,
      fixed_labels: newSelectedOption?.fixed_labels || {},
      createdBy: authData?.parsed?.fullName,
      editable_labels: newSelectedOption?.editable_labels?.reduce(
        (acc, label) => ({
          ...acc,
          [label]: {
            value: "",
            error: null,
          },
        }),
        {}
      ),
    }
    setFormState(newFormState)

    setSelected(newSelectedOption)
  }

  const onChangeLabelValue = (e) => {
    const editable_label = e.target.id
    setFormState(
      produce((formState) => {
        formState.editable_labels[editable_label].value = e.target.value
        formState.editable_labels[editable_label].error = null
      })
    )
  }

  const onChangeComment = (e) => {
    setFormState(
      produce((formState) => {
        formState.comment.value = e.target.value
        formState.comment.error = null
      })
    )
  }

  const setStartDate = (e, f) => {
    setFormState(
      produce((formState) => {
        formState.date.start = f
        formState.date.error = null
      })
    )
  }

  const setEndDate = (e, f) => {
    setFormState(
      produce((formState) => {
        formState.date.end = f
        formState.date.error = null
      })
    )
  }

  return (
    <Modal
      title="Schedule new silence"
      size="large"
      open={true}
      confirmButtonLabel={
        success || !selected || selected?.invalid ? null : "Save"
      }
      onConfirm={
        success || !selected || selected?.invalid ? null : onSubmitForm
      }
      onCancel={() => setClosed(true)}
    >
      <Messages />

      {success && (
        <Message className="mb-6" variant="success">
          A silence object with id <b>{success?.silenceID}</b> was created
          successfully. Please note that it may take up to 5 minutes for the
          alert to show up as silenced.
        </Message>
      )}

      {!success && (
        <>
          <Form className="mt-6">
            {selected && selected?.invalid && (
              <FormRow>
                <Message
                  text={`This silence template is invalid. ${selected.invalid}`}
                  variant="error"
                />
              </FormRow>
            )}

            <FormRow>
              <Select
                required
                label="Silence Template"
                value={selected?.id || "Select"}
                onValueChange={(value) => {
                  onChangeTemplate(value)
                }}
              >
                {silenceTemplates?.map((option) => (
                  <SelectOption
                    key={option.id}
                    id={option.id}
                    label={option.title}
                    value={option.id}
                  />
                ))}
              </Select>
            </FormRow>

            {selected && !selected?.invalid && (
              <FormRow>
                <Box>{selected?.description}</Box>
              </FormRow>
            )}
          </Form>

          {selected && !selected?.invalid && (
            <Form>
              <FormSection>
                <FormRow>
                  <TextInput
                    required
                    label="Silenced by"
                    value={formState.createdBy}
                    disabled
                  />
                </FormRow>
                <FormRow>
                  <div className="grid gap-2 grid-cols-2">
                    <DateTimePicker
                      value={formState?.date?.start || defaultDate}
                      dateFormat="Y-m-d H:i:S"
                      label="Select a start date"
                      enableTime
                      time_24hr
                      required
                      errortext={formState.date.error}
                      onChange={setStartDate}
                      enableSeconds
                    />
                    <DateTimePicker
                      value={formState?.date?.end || defaultDate}
                      dateFormat="Y-m-d H:i:S"
                      label="Select a end date"
                      enableTime
                      time_24hr
                      required
                      errortext={formState.date.error}
                      onChange={setEndDate}
                      enableSeconds
                    />
                  </div>
                </FormRow>

                <FormRow>
                  <Textarea
                    label="Comment"
                    value={formState.comment.value}
                    errortext={formState.comment.error}
                    onChange={onChangeComment}
                  ></Textarea>
                </FormRow>
              </FormSection>

              {formState?.editable_labels &&
                Object.keys(formState?.editable_labels).length > 0 && (
                  <FormSection>
                    <FormRow>
                      <p>
                        Editable Labels are labels that are editable. You can
                        use regular expressions.
                      </p>
                    </FormRow>

                    <FormRow>
                      <div className="grid gap-2 grid-cols-3">
                        {Object.keys(formState.editable_labels).map(
                          (editable_label, index) => (
                            <TextInput
                              required
                              label={editable_label}
                              key={index}
                              id={editable_label}
                              value={
                                formState?.editable_labels[editable_label].value
                              }
                              errortext={
                                formState?.editable_labels[editable_label]
                                  ?.error
                              }
                              onChange={onChangeLabelValue}
                            />
                          )
                        )}
                      </div>
                    </FormRow>
                  </FormSection>
                )}

              {Object.keys(formState?.fixed_labels).length > 0 && (
                <FormSection>
                  <FormRow>
                    <p>Fixed Labels are labels that are not editable.</p>
                  </FormRow>

                  <FormRow>
                    <Stack gap="2" wrap={true}>
                      {Object.keys(formState.fixed_labels).map(
                        (label, index) => (
                          <Pill
                            key={index}
                            pillKey={label}
                            pillKeyLabel={label}
                            pillValue={formState?.fixed_labels[label]}
                            pillValueLabel={formState?.fixed_labels[label]}
                          />
                        )
                      )}
                    </Stack>
                  </FormRow>
                </FormSection>
              )}
            </Form>
          )}
        </>
      )}
    </Modal>
  )
}

export default SilenceScheduled
