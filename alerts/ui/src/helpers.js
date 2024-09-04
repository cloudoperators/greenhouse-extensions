/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const parseError = (error) => {
  let errMsg = error

  // check if error is JSON containing message or just string
  if (typeof error === "string") {
    errMsg = parseMessage(error)
  }

  // check if the error is a object containing message
  if (typeof error === "object") {
    console.debug("Error parsing error message::object")
    if (error?.message) {
      errMsg = parseMessage(error?.message)
    }
  }
  return errMsg
}

const parseMessage = (message) => {
  let newMsg = message
  try {
    newMsg = JSON.parse(message)
    if (newMsg?.message) {
      newMsg = (newMsg?.code ? `${newMsg.code}, ` : "") + newMsg?.message
    }
  } catch (error) {}

  if (newMsg === "Failed to fetch") {
    newMsg =
      "Sorry, there was an issue fetching the data. Possible causes could include network issues, incorrect URL, or server outages. "
  }

  return newMsg
}

// debounce helper. This will debounce the passed function by the passed delay (in milliseconds)
export const debounce = (func, delay) => {
  let timeout
  return function (...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), delay)
  }
}
