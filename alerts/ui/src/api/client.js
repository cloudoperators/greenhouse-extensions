/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

class HTTPError extends Error {
  constructor(code, message) {
    super(message || code)
    this.name = "HTTPError"
    this.statusCode = code
  }
}

// Check response status
const checkStatus = (response) => {
  if (response.status < 400) {
    return response
  } else {
    return response.text().then((message) => {
      var error = new HTTPError(response.status, message || response.statusText)
      error.statusCode = response.status
      error.httperror = true
      return Promise.reject(error)
    })
  }
}

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
}

const request = (url, options = {}) => {
  const requestOptions = { headers: DEFAULT_HEADERS, ...options }

  return fetch(url, requestOptions)
    .then(checkStatus)
    .then((response) => response.json())
}

export const head = (url, options = {}) =>
  request(url, { method: "HEAD", ...options })
export const get = (url, options = {}) =>
  request(url, { method: "GET", ...options })
export const post = (url, options = {}) =>
  request(url, { method: "POST", ...options })
export const put = (url, options = {}) =>
  request(url, { method: "PUT", ...options })
export const patch = (url, options = {}) =>
  request(url, { method: "PATCH", ...options })
export const del = (url, options = {}) =>
  request(url, { method: "DELETE", ...options })
export const copy = (url, options = {}) =>
  request(url, { method: "COPY", ...options })
