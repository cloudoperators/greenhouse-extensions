/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_FORM_VALUES = {
  fixed_labels: {},
  editable_labels: {},
  comment: {
    value: "",
    error: null,
  },
  createdBy: "",
  date: {
    start: null,
    end: null,
    error: null,
  },
}

////// Form Validation

export const validateForm = (state) => {
  let formState = state
  let errorexist = false

  // validate if comment is at least 3 characters long
  if (formState.comment.value.length < 3) {
    errorexist = true
    formState = {
      ...formState,
      comment: {
        ...formState.comment, // Only create the comment object if it exists
        error: "Please enter at least 3 characters",
      },
    }
  }

  // checks if start date is before end date
  if (new Date(formState.date.start) >= new Date(formState.date.end)) {
    errorexist = true
    formState = {
      ...formState,
      date: {
        ...formState.date, // Only create the comment object if it exists
        error: "The start date need to be before the end date",
      },
    }
  }

  // All editable labels are valid regular expressions
  Object.keys(formState.editable_labels).map((editable_label) => {
    if (!validateLabelValue(formState.editable_labels[editable_label].value)) {
      errorexist = true
      formState = {
        ...formState,
        editable_labels: {
          ...formState.editable_labels,
          [editable_label]: {
            ...formState.editable_labels[editable_label],
            error: `Value for ${editable_label} is not a valid regular expression`,
          },
        },
      }
    }

    if (!formState.editable_labels[editable_label]?.value) {
      errorexist = true
      formState = {
        ...formState,
        editable_labels: {
          ...formState.editable_labels,
          [editable_label]: {
            ...formState.editable_labels[editable_label],
            error: `Value for ${editable_label} is empty`,
          },
        },
      }
    }
  })

  if (!errorexist) {
    return null
  }

  return formState
}

const validateLabelValue = (value) => {
  try {
    return !!new RegExp(value)
  } catch (e) {
    return false
  }
}
